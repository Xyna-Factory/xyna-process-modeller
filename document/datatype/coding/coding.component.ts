/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnDestroy, Output, ViewChild } from '@angular/core';

import { XoMethod } from '@pmod/xo/method.model';


@Component({
    selector: 'coding',
    templateUrl: './coding.component.html',
    styleUrls: ['./coding.component.scss'],
    standalone: false
})
export class CodingComponent implements AfterViewInit, OnDestroy {

    @ViewChild('javaEditorContainer', { static: false }) javaEditorContainer!: ElementRef;
    @ViewChild('pythonEditorContainer', { static: false }) pythonEditorContainer!: ElementRef;

    private readonly cdr = inject(ChangeDetectorRef);
    private readonly elementRef = inject(ElementRef);

    private resizeObserver: ResizeObserver;

    private javaEditor: any = null;
    private pythonEditor: any = null;

    private monaco: any = null;
    private monacoLoaded = false;

    javaCode = '';
    pythonCode = '';

    private _method: XoMethod | null = null;

    @Input()
    set method(value: XoMethod) {
        if (value === this._method) return; // unnötige Updates vermeiden
        this._method = value;
        this.updateEditor(true); // true = initial update
    }

    get method(): XoMethod {
        return this._method;
    }

    @Input() readonly = false;

    @Output() readonly implementationChange = new EventEmitter<string>();

    get implementation(): string {
        return this.method ? this.method.implementationArea.text : '';
    }

    set implementation(value: string) {
        if (this.method && this.implementation !== value) {
            this.implementationChange.emit(value);
        }
    }

    get isPython(): boolean {
        return this.method?.implementationType === XoMethod.IMPL_TYPE_CODED_SERVICE_PYTHON;
    }

    get isAbstract(): boolean {
        return this.method?.implementationType === XoMethod.IMPL_TYPE_ABSTRACT;
    }

    constructor() {
        this.resizeObserver = new ResizeObserver(() => {
            const editor = this.isPython ? this.pythonEditor : this.javaEditor;
            editor?.layout();
        });
    }

    // ---------------------------------------------------------------------
    // LIFECYCLE
    // ---------------------------------------------------------------------

    async ngAfterViewInit() {
        await this.lazyLoadMonaco();
        await this.createEditors();
        this.resizeObserver.observe(this.elementRef.nativeElement);
    }

    ngOnDestroy() {
        this.resizeObserver.disconnect();
        this.javaEditor?.dispose();
        this.pythonEditor?.dispose();
    }

    // ---------------------------------------------------------------------
    // LAZY LOAD MONACO
    // ---------------------------------------------------------------------

    private async lazyLoadMonaco() {
        if (this.monacoLoaded) return;
        const monacoPkg = await import('monaco-editor');
        this.monaco = monacoPkg;
        this.monacoLoaded = true;
    }

    // ---------------------------------------------------------------------
    // EDITOR ERSTELLUNG
    // ---------------------------------------------------------------------

    private async createEditors() {
        if (!this.monacoLoaded) return;

        // Java Editor
        if (this.javaEditorContainer) {
            this.javaEditor = this.monaco.editor.create(this.javaEditorContainer.nativeElement, {
                theme: 'vs-dark',
                language: 'java',
                scrollBeyondLastLine: false,
                readOnly: this.readonly,
                minimap: { enabled: true },
                automaticLayout: false,
                fontSize: 13,
                lineNumbers: 'on',
                folding: true
            });
            this.javaEditor.onDidBlurEditorWidget(() => {
                if (!this.readonly && this.javaEditor.getValue() !== this.implementation) {
                    this.codingBlur(this.javaEditor.getValue());
                }
            });
        }

        // Python Editor
        if (this.pythonEditorContainer) {
            this.pythonEditor = this.monaco.editor.create(this.pythonEditorContainer.nativeElement, {
                theme: 'vs-dark',
                language: 'python',
                scrollBeyondLastLine: false,
                readOnly: this.readonly,
                minimap: { enabled: true },
                automaticLayout: false,
                fontSize: 13,
                lineNumbers: 'on',
                folding: true
            });
            this.pythonEditor.onDidBlurEditorWidget(() => {
                if (!this.readonly && this.pythonEditor.getValue() !== this.implementation) {
                    this.codingBlur(this.pythonEditor.getValue());
                }
            });
        }

        this.updateEditor(true);
    }

    // ---------------------------------------------------------------------
    // UPDATE / LAYOUT
    // ---------------------------------------------------------------------

    private updateEditor(initial = false) {
        if (!this.method) return;

        const isPy = this.isPython;

        // Python Editor
        if (isPy && this.pythonEditor) {
            // nur initial setzen oder wenn Wert unterschiedlich
            if (initial || this.pythonEditor.getValue() !== this.implementation) {
                this.pythonCode = this.implementation;
                this.pythonEditor.setValue(this.implementation);
            }
            this.pythonEditor.updateOptions({ readOnly: this.readonly });
        }

        // Java Editor
        else if (!isPy && this.javaEditor) {
            const code = this.isAbstract ? '/* Abstract Method */' : this.implementation;
            if (initial || this.javaEditor.getValue() !== code) {
                this.javaCode = code;
                this.javaEditor.setValue(code);
            }
            this.javaEditor.updateOptions({ readOnly: this.readonly });
        }

        // Layout
        const rect = this.elementRef.nativeElement.getBoundingClientRect();
        const editor = isPy ? this.pythonEditor : this.javaEditor;
        editor?.layout({ width: rect.width, height: rect.height });

        this.cdr.markForCheck();
    }

    // ---------------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------------

    codingBlur(code: string) {
        this.implementation = code;
    }
}
