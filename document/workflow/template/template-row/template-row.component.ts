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
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';

import { ModellingActionType } from '../../../../api/xmom.service';
import { XoData } from '../../../../xo/data.model';
import { XoException } from '../../../../xo/exception.model';
import { TextItem, XoFormula } from '../../../../xo/formula.model';
import { XoInsertFormulaVariableRequest } from '../../../../xo/insert-formula-variable-request.model';
import { XoItem } from '../../../../xo/item.model';
import { XoRequest } from '../../../../xo/request.model';
import { XoVariable } from '../../../../xo/variable.model';
import { Distance, ModRelativeHoverSide } from '../../shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDragEvent, ModDropAreaDirective, ModDropEvent } from '../../shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent, TriggeredAction } from '../../shared/modelling-object.component';
import { TemplateRow } from '../model/template-row.model';
import { TemplateText } from '../model/template-text.model';
import { TemplatePartModifyEvent, TemplatePartTextComponent } from '../template-part/template-part-text.component';
import { NavigationDirection, TemplatePartComponent, TemplatePartSwitchFocusEvent } from '../template-part/template-part.component';


export interface SplitTemplateRowEvent {
    newRow: TemplateRow;
    beneathRow: TemplateRow;
}

export interface SwitchTemplateRowFocusEvent {
    source: TemplateRow;
    direction: NavigationDirection;
    srcCaretPosition: number;       // spacing in px
}


@Component({
    selector: 'template-row',
    templateUrl: './template-row.component.html',
    styleUrls: ['./template-row.component.scss'],
    standalone: false
})
export class TemplateRowComponent extends ModellingObjectComponent {

    private partWaitingForFocus: (XoItem & TextItem) = null;
    private _textParts: QueryList<TemplatePartTextComponent>;

    @ViewChild('number', {static: false})
    lineNumberElement: ElementRef;

    @ViewChildren('templatePart')
    parts: QueryList<TemplatePartComponent>;

    @ViewChild(ModDropAreaDirective, {static: false})
    dropArea: ModDropAreaDirective;

    @Input()
    lineNumber = 0;

    @Output()
    readonly split = new EventEmitter<SplitTemplateRowEvent>();

    @Output()
    readonly merge = new EventEmitter<TemplateRow>(false);

    @Output()
    readonly switchRow = new EventEmitter<SwitchTemplateRowFocusEvent>(false);

    @Input()
    set row(value: TemplateRow) {
        this.setModel(value);
    }


    get row(): TemplateRow {
        return this.getModel() as TemplateRow;
    }


    allowItem = (xoFqn: string): boolean =>
        !this.readonly && !![XoData, XoException].find(xo => xo.fqn.encode().toLowerCase() === xoFqn.toLowerCase());


    updateIndicator = (event: ModDragEvent): Distance => {
        // indentation only calculated relatively to left side:
        //  * right side has to be switched to left
        //  * respective element shall always be that one under the cursor (no switch to index+1 from the middle on)
        event.side = ModRelativeHoverSide.left;
        event.index = event.indexUnderCursor;

        const indentation = this.parts.get(event.indexUnderCursor)?.getLetterPositionFromFraction(event.s, event.t);
        return indentation;
    };


    dropped(event: ModDropEvent) {
        const formula = new XoFormula();
        formula.expression = `%${this.row.variables.length}%`;

        const changeFormulaAction: TriggeredAction = {
            type: ModellingActionType.change,
            objectId: this.row.id,
            request: new XoRequest()    // not necessary, is overridden by template with complete expression
        };

        // split text block into two, if variable has been dropped in between
        const partUnderCursor = this.row.templateParts[event.indexUnderCursor];
        let splitPart: TemplateText;
        if (partUnderCursor instanceof TemplateText) {
            const pivot = partUnderCursor.getLetterIndex(event.s);
            const text = partUnderCursor.getText();
            if (pivot > 0 && pivot < text.length) {
                partUnderCursor.setText(text.substring(0, pivot));
                splitPart = new TemplateText();
                splitPart.setText(text.substring(pivot));
                event.index = event.indexUnderCursor + 1;
            }
        }

        // add formula and split text part, if any
        this.row.addPart(formula, event.index);
        if (splitPart) {
            this.row.addPart(splitPart, event.index < 0 ? event.index : event.index + 1);
        }

        this.performAction({
            type: ModellingActionType.insert,
            objectId: this.row.id,
            request: new XoInsertFormulaVariableRequest('', -1, event.item as XoVariable),
            subsequentAction: changeFormulaAction
        });
    }


    @HostListener('click', ['$event.target'])
    public selectRow(target: Element) {
        const hitStart = target === this.lineNumberElement.nativeElement;
        const hitEnd = target === this.elementRef.nativeElement || target === this.dropArea.elementRef.nativeElement;
        if (hitStart && this.row.templateParts.length > 0) {
            this.focusPart(this.row.templateParts[0], 0);
        } else if (hitEnd) {
            // if last part is text, just focus that part. Otherwise, create a new text part at the end of the row
            if (this.row.templateParts.length > 0 && !this.isFormula(this.row.templateParts[this.row.templateParts.length - 1])) {
                const lastPart = this.row.templateParts[this.row.templateParts.length - 1];
                this.focusPart(lastPart, lastPart.getText().length);
            } else {
                const part = TemplateText.withText('');
                this.partWaitingForFocus = this.row.addPart(part);
            }
        }
    }


    newlineInPart(event: TemplatePartModifyEvent) {
        // create new part with text right to newline
        const newPart = TemplateText.withText(event.text);

        // split row and shift sub-part and all parts right to it into a new row
        const partIndex = this.row.templateParts.findIndex(part => part === event.part);
        const newRow = new TemplateRow();
        newRow.addPart(newPart);
        for (let i = partIndex + 1; i < this.row.templateParts.length; i++) {
            newRow.addPart(this.row.templateParts[i]);
        }

        // truncate current row
        this.row.templateParts.splice(partIndex + 1, this.row.templateParts.length - partIndex - 1);

        this.split.emit({ newRow: newRow, beneathRow: this.row });
    }


    deletePart(event: TemplatePartModifyEvent) {
        const partIndex = this.row.templateParts.findIndex(part => part === event.part);
        if (partIndex === 0) {
            // part is first part in row -> merge with upper row
            const length = event.part.getText().length;
            this.merge.emit(this.row);

            // restore caret position (emit was executed synchronously, so the merge has already been done)
            this.focusPart(event.part, event.part.getText().length - length);

        } else if (this.row.templateParts[partIndex - 1] instanceof TemplateText) {
            // part succeeds another text-part -> merge parts
            const previousPart = this.row.templateParts[partIndex - 1];
            const previousText = previousPart.getText().substr(0, previousPart.getText().length - 1);
            event.part.setText(previousText + event.part.getText());
            this.row.templateParts.splice(partIndex - 1, 1);

            // restore caret position
            const partComponent = this._textParts ? this._textParts.find(part => part.part === event.part) : null;
            if (partComponent) {
                partComponent.setCaret(previousText.length);
            }
        } else if (this.row.templateParts[partIndex - 1] instanceof XoFormula) {
            // delete preceding formula-part
            this.row.templateParts.splice(partIndex - 1, 1);
        }
    }


    switchFocus(event: TemplatePartSwitchFocusEvent) {
        const partIndex = this.row.templateParts.findIndex(part => part === event.part);
        if (event.direction === 'LEFT') {
            // focus previous text-part
            for (let i = partIndex - 1;
                i >= 0 && !this.focusPart(this.row.templateParts[i]);
                i--
                 
            );
        } else if (event.direction === 'RIGHT') {
            // focus next text-part
            for (let i = partIndex + 1;
                i < this.row.templateParts.length && !this.focusPart(this.row.templateParts[i], 0);
                i++
                 
            );
        } else if (event.direction === 'UP' || event.direction === 'DOWN') {
            this.switchRow.emit({
                source: this.row,
                direction: event.direction,
                srcCaretPosition: this.getCaretPosition(partIndex, event.srcCaretPosition)
            });
        }
    }


    /**
     * Calculates caret position relative to row's left border (in px)
     */
    private getCaretPosition(partIndex: number, caretIndex: number): number {
        let width = 0;
        for (let i = 0; i < Math.min(partIndex, this.parts.length); i++) {
            width += this.parts.get(i).getWidth();
        }
        // add local caret position inside part
        width += this.parts.get(partIndex)?.getLetterPositionFromIndex(caretIndex)?.dx ?? 0;
        return width;
    }


    private focusPart(templatePart: XoItem & TextItem, caretIndex?: number): boolean {
        const partComponent = this._textParts ? this._textParts.find(part => part.part === templatePart) : null;
        partComponent?.setFocus(caretIndex);
        return !!partComponent;
    }


    /**
     * Set focus to text part
     */
    @ViewChildren('textPart')
    private set textParts(parts: QueryList<TemplatePartTextComponent>) {
        this._textParts = parts;
        // focus part if there is a waiting one
        if (this.partWaitingForFocus) {
            this.focusPart(this.partWaitingForFocus);
            this.partWaitingForFocus = null;
        }
    }


    isFormula(part: XoItem): boolean {
        return part instanceof XoFormula;
    }


    /**
     * Set focus into row (at a specific position)
     *
     * @param caretPosition Spacing from the left border (in px) to set the caret with
     */
    setFocus(caretPosition = 0) {
        if (this.row.templateParts.length === 0) {
            return;
        }

        let i = 0;
        for (; i < this.parts.length; i++) {
            const w = this.parts.get(i).getWidth();
            if (caretPosition > w) {
                caretPosition -= w;
            } else {
                break;
            }
        }

        // set caret to rightmost position if desired position is outside of line's text
        if (i >= this.parts.length) {
            i = this.parts.length - 1;
            caretPosition = Number.MAX_SAFE_INTEGER;
        }

        // transform caret position into caret index
        const part = this.parts.get(i);
        const index = Math.min(Math.round(caretPosition / part.getWidth() * part.part.getText().length), part.part.getText().length);

        part.setFocus(index);
    }
}
