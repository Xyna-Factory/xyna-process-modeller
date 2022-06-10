/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
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
import { Component, Input } from '@angular/core';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoFormulaArea } from '../../../xo/formula-area.model';
import { XoFormula } from '../../../xo/formula.model';
import { XoInsertFormulaRequest } from '../../../xo/insert-formula-request.model';
import { XoInsertRequest } from '../../../xo/insert-request.model';
import { XoRequest } from '../../../xo/request.model';
import { ModellingObjectComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'formula-area',
    templateUrl: './formula-area.component.html',
    styleUrls: ['./formula-area.component.scss']
})
export class FormulaAreaComponent extends ModellingObjectComponent {

    @Input()
    areaLabel: string = null;

    @Input()
    newFormulaExpression = '';

    @Input()
    set formulaArea(value: XoFormulaArea) {
        this.setModel(value);
    }


    get formulaArea(): XoFormulaArea {
        return this.getModel() as XoFormulaArea;
    }


    getInsertRequest(expression?: string, index?: number): XoInsertRequest {
        return new XoInsertFormulaRequest('', index !== undefined ? index : -1, expression ?? '');
    }


    addFormula(expression?: string, index?: number) {
        this.performAction({ type: ModellingActionType.insert, objectId: this.formulaArea.id, request: this.getInsertRequest(expression ?? this.newFormulaExpression, index) });
    }


    duplicateFormula(formula: XoFormula, index?: number) {
        this.addFormula(formula.expression, index);
    }


    removeFormula(formula: XoFormula) {
        if (formula) {
            this.performAction({ type: ModellingActionType.delete, objectId: formula.id, request: new XoRequest() });
        }
    }


    isDefaultCollapsed(): boolean {
        return !this.detailSettings.showMappings;
    }
}
