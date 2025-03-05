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
import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

import { coerceBoolean } from '@zeta/base';


@Directive({
    selector: '[mod-content-editable]',
    standalone: false
})
export class ModContentEditableDirective {

    private _enabled = true;
    private _finishOnEnter = true;

    @Input('mod-content-editable-trigger')
    triggerType: 'mousedown' | 'dblclick' = 'dblclick';

    @Output('mod-content-editable-start-edit')
    readonly startEdit = new EventEmitter<string>();

    @Output('mod-content-editable-after-edit')
    readonly afterEdit = new EventEmitter<string>();


    constructor(private readonly elementRef: ElementRef) {
    }


    @Input('mod-content-editable')
    set enabled(value: boolean) {
        this._enabled = coerceBoolean(value);
    }


    get enabled(): boolean {
        return this._enabled;
    }


    @Input('mod-content-editable-value')
    set value(value: string) {
        this.elementRef.nativeElement.innerText = value ? value : '';
    }


    @Input('mod-content-editable-should-finish-on-enter')
    set finishOnEnter(value: boolean) {
        this._finishOnEnter = coerceBoolean(value);
    }


    get finishOnEnter(): boolean {
        return this._finishOnEnter;
    }


    @HostListener('mousedown', ['$event'])
    private mousedown(event: MouseEvent) {
        if (this.enabled && this.triggerType === 'mousedown') {
            this.startEditing();
            event.stopPropagation();
        }
    }


    @HostListener('dblclick', ['$event'])
    private dblclick(event: MouseEvent) {
        if (this.enabled && this.triggerType === 'dblclick') {
            this.startEditing();
            event.stopPropagation();
        }
    }


    private startEditing() {
        if (this.enabled) {
            this.elementRef.nativeElement.contentEditable = true;
            this.startEdit.emit(this.elementRef.nativeElement.innerText);

            // focussing the element directly after making content editable doesn't work
            setTimeout(() => {
                this.elementRef.nativeElement.focus();
            }, 0);
        }
    }


    @HostListener('blur', ['$event.currentTarget.innerText'])
    private finishEditing(text: string) {
        if (this.enabled) {
            this.elementRef.nativeElement.contentEditable = false;
            this.afterEdit.emit(text);
        }
    }


    @HostListener('keydown.enter')
    private enterKey() {
        if (this.finishOnEnter) {
            this.elementRef.nativeElement.blur();
        }
    }


    @HostListener('keydown', ['$event'])
    private keydown(event: Event) {
        if (this.elementRef.nativeElement.contentEditable) {
            event.stopPropagation();
        }
    }
}
