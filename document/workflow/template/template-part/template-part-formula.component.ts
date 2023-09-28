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
import { Component, ViewChild } from '@angular/core';
import { FormulaComponent } from '../../formula/formula.component';

import { TemplatePartComponent } from './template-part.component';


@Component({
    selector: 'template-part-formula',
    templateUrl: './template-part-formula.component.html',
    styleUrls: ['./template-part.component.scss', './template-part-formula.component.scss']
})
export class TemplatePartFormulaComponent extends TemplatePartComponent {

    @ViewChild(FormulaComponent, { static: false })
    formula: FormulaComponent;


    /**
     * @param caretIndex Index of letter to set caret at
     */
    setFocus(caretIndex?: number) {
        this.formula.clickOnFormula();

        // TODO estimate part from caret index (which is the index of the character inside the XFL expression)
        // const partIndex = ??;

        // const part = this.formula.formula.visibleParts[partIndex];
        // this.formula.setCaretToPart(part);
    }
}
