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
import { Component, ElementRef, ViewChild } from '@angular/core';

import { FormulaPartLiteral } from '../../../../../xo/util/formula-parts/formula-part-literal';
import { FormulaEditablePartComponent } from '../formula-editable-part.component';
import { ModDnDContentEditableDirective } from '../../../shared/drag-and-drop/mod-dnd-content-editable.directive';


@Component({
    selector: 'formula-part-literal',
    templateUrl: './formula-part-literal.component.html',
    styleUrls: ['./formula-part-literal.component.scss'],
    imports: [ModDnDContentEditableDirective]
})
export class FormulaPartLiteralComponent extends FormulaEditablePartComponent {

    private _editing = false;

    @ViewChild('literal', {static: false})
    private readonly _literal: ElementRef;


    startEditing() {
        this._editing = true;
        super.startEditing();
    }


    finishEditing(event?: FocusEvent) {
        this._editing = false;
        if (event?.target) {
            (this.formulaPart as FormulaPartLiteral).text = (event.target as Element).textContent;

            /** @todo fixme: Weird bug in angular causes formulaPart.text to occur twice in textContent.
             * Setting textContent explicitly to formulaPart.text interestingly fixes this
             */
            (event.target as Element).textContent = this.formulaPart.text;
        }
        super.finishEditing(event);
    }


    setFocus() {
        if (this._literal && this._literal.nativeElement) {
            this._literal.nativeElement.focus();
        }
    }


    protected keyDown(event: KeyboardEvent) {
        super.keyDown(event);
        if (event.key === 'Enter') {
            event.preventDefault();
            this.acceptEditing();
            this.finishEditing();
        }
    }


    get editing(): boolean {
        return this._editing;
    }
}
