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
import { Directive, ElementRef, Input, NgZone, OnDestroy, OnInit } from '@angular/core';

import { coerceBoolean } from '@zeta/base';


/**
Directive aims to copy the behavior of native [contenteditable] of HTMLElements without to worry if the target element is a child of a draggable element.

Browsers display an inconsistent behavior when it comes to selecting text via mouse within a draggable element. They tend to disallow it.

This directive creates a workaround:

If the target element is focused, this directive traverses the DOM upwards to the body and
removes the dragability of every parent.

While the target element is focused, selecting text with the mouse is possible.

On blur it reestablishes the former state.
 */
@Directive({
    selector: '[mod-dnd-contenteditable]'
})
export class ModDnDContentEditableDirective implements OnInit, OnDestroy {

    private readonly draggableElementsSet = new Set<HTMLElement>();
    private _contentEditable = false;

    @Input('mod-dnd-contenteditable')
    set contentEditable(value: boolean) {
        this._contentEditable = coerceBoolean(value);
        if (this.elementRef.nativeElement as HTMLElement) {
            (this.elementRef.nativeElement as HTMLElement).contentEditable = '' + this.contentEditable;
        }
    }

    get contentEditable(): boolean {
        return this._contentEditable;
    }

    constructor(private readonly elementRef: ElementRef, private readonly ngZone: NgZone) {
    }


    ngOnInit(): void {
        const el = (this.elementRef.nativeElement as HTMLElement);

        // making sure that the target element is focusable via mouse click (or tab)
        if (el.tabIndex < 0) {
            el.tabIndex = 0;
        }

        el.contentEditable = this.contentEditable + '';

        this.ngZone.runOutsideAngular(() => {
            el.addEventListener('focus', this.onfocus);
            el.addEventListener('blur', this.onblur);
        });
    }

    ngOnDestroy(): void {
        (this.elementRef.nativeElement as HTMLElement).removeEventListener('focus', this.onfocus);
        (this.elementRef.nativeElement as HTMLElement).removeEventListener('blur', this.onblur);
    }


    private readonly onfocus = () => {
        let el = (this.elementRef.nativeElement as HTMLElement);

        while (el) {
            if (el.draggable) {
                el.draggable = false;
                this.draggableElementsSet.add(el);
            }
            el = el.parentElement;
        }
    };

    private readonly onblur = () => {
        this.draggableElementsSet.forEach(elem => elem.draggable = true);
        this.draggableElementsSet.clear();
    };

}
