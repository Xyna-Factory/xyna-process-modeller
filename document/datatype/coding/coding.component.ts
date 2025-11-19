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
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, Output } from '@angular/core';

import * as monaco from 'monaco-editor';

import { XoMethod } from '../../../xo/method.model';


@Component({
    selector: 'coding',
    templateUrl: './coding.component.html',
    styleUrls: ['./coding.component.scss'],
    standalone: false
})
export class CodingComponent {

    private readonly cdr = inject(ChangeDetectorRef);
    private readonly elementRef = inject(ElementRef);

    private resizeObserver: ResizeObserver;

    constructor() {
        this.resizeObserver = new ResizeObserver(() => {
            const editor = this.isPython ? this.pythonEditor : this.javaEditor;
            editor?.layout();
        });
    }

    ngAfterViewInit() {
        this.resizeObserver.observe(this.elementRef.nativeElement);
    }

    ngOnDestroy() {
        this.resizeObserver.disconnect();
    }

    private _method: XoMethod;
    private javaEditor: monaco.editor.IStandaloneCodeEditor;
    private pythonEditor: monaco.editor.IStandaloneCodeEditor;

    javaCode: string;
    pythonCode: string;

    readonly javaEditorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        theme: 'vs-dark',
        language: 'java',
        scrollBeyondLastLine: false,
        readOnly: false,
        automaticLayout: false,
        lineNumbers: 'on',
        minimap: { enabled: true },
        wordWrap: 'off',
        folding: true,
        fontSize: 13,
        renderWhitespace: 'none'
    };

    readonly pythonEditorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        theme: 'vs-dark',
        language: 'python',
        scrollBeyondLastLine: false,
        readOnly: false,
        automaticLayout: false,
        lineNumbers: 'on',
        minimap: { enabled: true },
        wordWrap: 'off',
        folding: true,
        fontSize: 13,
        renderWhitespace: 'none'
    };

    @Input()
    set method(value: XoMethod) {
        this._method = value;
        this.updateEditor();
    }

    get method(): XoMethod {
        return this._method;
    }

    set implementation(value: string) {
        if (this.method && this.implementation !== value) {
            this.implementationChange.emit(value);
        }
    }

    get implementation(): string {
        return this.method ? this.method.implementationArea.text : '';
    }

    @Input()
    readonly: boolean;

    get isAbstract(): boolean {
        return this.method ? this.method.implementationType === XoMethod.IMPL_TYPE_ABSTRACT : true;
    }

    get isPython(): boolean {
        return this.method?.implementationType === XoMethod.IMPL_TYPE_CODED_SERVICE_PYTHON;
    }

    @Output()
    readonly implementationChange = new EventEmitter<string>();

    private updateEditor() {
        const editor = this.isPython ? this.pythonEditor : this.javaEditor;

        if (!editor) {
            setTimeout(() => this.updateEditor(), 20);
            return;
        }

        if (this.method) {
            if (this.isPython) {
                this.pythonCode = this.implementation;
                this.pythonEditorOptions.readOnly = this.readonly;
                this.pythonEditor.updateOptions(this.pythonEditorOptions);
            } else {
                this.javaCode = this.isAbstract ? '/* Abstract Method */' : this.implementation;
                this.javaEditorOptions.readOnly = this.readonly;
                this.javaEditor.updateOptions(this.javaEditorOptions);
            }
        }

        const rect = this.elementRef.nativeElement.getBoundingClientRect();
        editor.layout({ width: rect.width, height: rect.height });

        this.cdr.markForCheck();
    }

    codingBlur(implementation: string) {
        this.implementation = implementation;
    }

    monacoInitJava(editor: monaco.editor.IStandaloneCodeEditor) {
        this.javaEditor = editor;
        editor.onDidBlurEditorWidget(() => {
            if (!this.javaEditorOptions.readOnly && this.javaCode !== this.implementation) {
                this.codingBlur(this.javaCode);
            }
        });
    }

    monacoInitPython(editor: monaco.editor.IStandaloneCodeEditor) {
        this.pythonEditor = editor;
        editor.onDidBlurEditorWidget(() => {
            if (!this.pythonEditorOptions.readOnly && this.pythonCode !== this.implementation) {
                this.codingBlur(this.pythonCode);
            }
        });
    }
}
