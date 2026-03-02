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
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnDestroy, Output } from '@angular/core';

import { XoMethod } from '@pmod/xo/method.model';
import * as monaco from 'monaco-editor';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

@Component({
    selector: 'coding',
    templateUrl: './coding.component.html',
    styleUrls: ['./coding.component.scss'],
    imports: [MonacoEditorModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodingComponent implements AfterViewInit, OnDestroy {

    private readonly cdr = inject(ChangeDetectorRef);
    private readonly el = inject(ElementRef);

    private resizeObserver!: ResizeObserver;

    javaEditor: monaco.editor.IStandaloneCodeEditor | null = null;
    pythonEditor: monaco.editor.IStandaloneCodeEditor | null = null;

    javaOptions = {
        theme: 'vs-dark',
        language: 'java',
        readOnly: false,
        minimap: { enabled: true },
        fontSize: 13
    };

    pythonOptions = {
        theme: 'vs-dark',
        language: 'python',
        readOnly: false,
        minimap: { enabled: true },
        fontSize: 13
    };

    javaCode = '';
    pythonCode = '';

    private _method: XoMethod | null = null;

    @Input()
    set method(value: XoMethod | null) {
        this._method = value;
        this.updateEditor(true);
    }

    get method(): XoMethod | null {
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

    constructor() { }

    // ----------------------------------------------------
    // Lifecycle
    // ----------------------------------------------------

    ngAfterViewInit() {
        this.resizeObserver = new ResizeObserver(() => {
            setTimeout(() => this.layoutEditor(), 0);
        });

        this.resizeObserver.observe(this.el.nativeElement);
    }

    ngOnDestroy() {
        this.resizeObserver.disconnect();
    }

    // ----------------------------------------------------
    // Editor Init (CORRECT way)
    // ----------------------------------------------------

    onJavaInit(editor: monaco.editor.IStandaloneCodeEditor) {
        this.javaEditor = editor;
        editor.onDidBlurEditorText(() => this.handleBlur());
        this.updateEditor(true);
    }

    onPythonInit(editor: monaco.editor.IStandaloneCodeEditor) {
        this.pythonEditor = editor;
        editor.onDidBlurEditorText(() => this.handleBlur());
        this.updateEditor(true);
    }

    // ----------------------------------------------------
    // Updates
    // ----------------------------------------------------

    private updateEditor(initial = false) {
        if (!this.method) return;

        // PYTHON
        if (this.isPython && this.pythonEditor) {
            const code = this.implementation;

            if (initial || this.pythonEditor.getValue() !== code) {
                this.pythonCode = code;
                this.pythonEditor.setValue(code);
            }

            this.pythonEditor.updateOptions({ readOnly: this.readonly });
        }

        // JAVA
        if (!this.isPython && this.javaEditor) {
            const code = this.isAbstract
                ? '/* Abstract Method */'
                : this.implementation;

            if (initial || this.javaEditor.getValue() !== code) {
                this.javaCode = code;
                this.javaEditor.setValue(code);
            }

            this.javaEditor.updateOptions({ readOnly: this.readonly });
        }

        setTimeout(() => this.layoutEditor(), 0);
        this.cdr.markForCheck();
    }

    private layoutEditor() {
        const editor = this.isPython ? this.pythonEditor : this.javaEditor;
        editor?.layout();
    }

    // ----------------------------------------------------
    // Blur → emit changes
    // ----------------------------------------------------

    private handleBlur() {
        const editor = this.isPython ? this.pythonEditor : this.javaEditor;
        const value = editor?.getValue();
        if (!this.readonly && value !== this.implementation) {
            this.implementation = value ?? '';
        }
    }
}
