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
import { Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';

import { XcContentEditableDirective } from '@zeta/xc';

import { Distance, ModDragAndDropService } from '../../shared/drag-and-drop/mod-drag-and-drop.service';
import { TemplateText } from '../model/template-text.model';
import { TemplatePartComponent } from './template-part.component';


export interface TemplatePartModifyEvent {
    part: TemplateText;
    text: string;   // text of part to be transferred into the new part
}


@Component({
    selector: 'template-part-text',
    templateUrl: './template-part-text.component.html',
    styleUrls: ['./template-part.component.scss', './template-part-text.component.scss'],
    standalone: false
})
export class TemplatePartTextComponent extends TemplatePartComponent {

    protected readonly elementRef = inject(ElementRef);
    protected readonly dnd = inject(ModDragAndDropService);

    private _inputElement: ElementRef;

    @ViewChild('textInput', { static: false })
    set inputElement(value: ElementRef) {
        this._inputElement = value;
        if (this.inputElement && this.inputElement.nativeElement && this.part) {
            this.inputElement.nativeElement.textContent = this.part.getText();
        }
    }

    get inputElement(): ElementRef {
        return this._inputElement;
    }

    @Output()
    readonly newline = new EventEmitter<TemplatePartModifyEvent>();

    @Output()
    readonly deletePart = new EventEmitter<TemplatePartModifyEvent>();

    readonly contentEditableValue = XcContentEditableDirective.getContentEditableValue();

    @Input()
    set part(value: TemplateText) {
        this.setModel(value);

        // the text can't be set via databinding, because the editing and splitting would cause some "changed after checked"-errors
        this.part.textChange.subscribe(text => {
            if (this.inputElement && this.inputElement.nativeElement && this.inputElement.nativeElement.textContent !== text) {
                this.inputElement.nativeElement.textContent = text;
            }
        });
    }


    get part(): TemplateText {
        return this.getModel() as TemplateText;
    }


    remove(event?: KeyboardEvent) {
        if (event.key === 'Delete') {
            event.stopPropagation();
        } else {
            super.remove(event);
        }
    }


    edit(text: string) {
        this.part.setText(text);
    }


    enterKey() {
        const index = window.getSelection().getRangeAt(0).startOffset;
        let text = '';
        if (this.inputElement && this.inputElement.nativeElement) {
            text = this.inputElement.nativeElement.textContent;
        }
        const leftText = text.substr(0, index);
        const rightText = text.substr(index);
        this.part.setText(leftText);

        this.newline.emit({ part: this.part, text: rightText });
    }


    backspaceKey(event: KeyboardEvent) {
        // pressed backspace at the beginning of a part
        if (window.getSelection().getRangeAt(0).startOffset === 0) {
            event.preventDefault();
            let text = '';
            if (this.inputElement && this.inputElement.nativeElement) {
                text = this.inputElement.nativeElement.textContent;
            }
            this.deletePart.emit({ part: this.part, text: text });
        }
    }


    /**
     * @param caretIndex Index of letter to set caret at
     */
    setFocus(caretIndex?: number) {
        if (this.inputElement && this.inputElement.nativeElement) {
            this.inputElement.nativeElement.focus();

            // place caret (at the end by default)
            this.setCaret(isNaN(caretIndex) ? this.part.getText().length : caretIndex);
        }
    }


    setCaret(index: number) {
        if (this.inputElement.nativeElement.childNodes.length > 0) {
            // prevent causing key-events to be applied to the newly-focused element by deferring the re-focus from the active event-chain
            setTimeout(() => {
                const range = document.createRange();
                range.setStart(this.inputElement.nativeElement.childNodes[0], index);
                range.collapse(true);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }, 0);
        }
    }


    /**
     * Returns letter position (in pixels) relative to this component
     * @param s fraction [0..1] in x direction relative to this element
     * @param t fraction [0..1] in y direction relative to this element
     */
    getLetterPositionFromFraction(s: number, t: number): Distance {
        const pivot = this.part.getLetterIndex(s);
        return this.getLetterPositionFromIndex(pivot);
    }


    /**
     * Returns letter position (in pixels) relative to this component
     * @param index Index of letter
     */
    getLetterPositionFromIndex(index: number): Distance {
        const leftText = this.part.getText().substring(0, index);

        const style = (element: Element, p: string): string => window.getComputedStyle(element, null).getPropertyValue(p);

        const fontWeight = style(this.elementRef.nativeElement, 'font-weight') ?? '400';
        const fontSize = style(this.elementRef.nativeElement, 'font-size') ?? '11px';
        const fontFamily = style(this.elementRef.nativeElement, 'font-family') || '"Source Code Pro Regular", monospace';
        const font = `${fontWeight} ${fontSize} ${fontFamily}`;

        return { dx: this.dnd.getTextWidth(leftText, font), dy: 0 };
    }
}
