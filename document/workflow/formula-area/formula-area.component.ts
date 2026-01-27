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
import { Component, Input } from '@angular/core';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoFormulaArea } from '../../../xo/formula-area.model';
import { XoFormula } from '../../../xo/formula.model';
import { XoInsertFormulaRequest } from '../../../xo/insert-formula-request.model';
import { XoInsertRequest } from '../../../xo/insert-request.model';
import { XoRequest } from '../../../xo/request.model';
import { ModellingObjectComponent } from '../shared/modelling-object.component';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../zeta/i18n/i18n.module';
import { FormulaComponent } from '../formula/formula.component';


@Component({
    selector: 'formula-area',
    templateUrl: './formula-area.component.html',
    styleUrls: ['./formula-area.component.scss'],
    imports: [XcModule, I18nModule, FormulaComponent]
})
export class FormulaAreaComponent extends ModellingObjectComponent {

    private _expressionFilter = '';
    private _visibleFormulas: XoFormula[] = [];


    @Input()
    areaLabel: string = null;

    @Input()
    newFormulaExpression = '';

    @Input()
    set formulaArea(value: XoFormulaArea) {
        this.setModel(value);
        this.filterFormulas();
    }

    get formulaArea(): XoFormulaArea {
        return this.getModel() as XoFormulaArea;
    }


    // filters formulas including expression filter as xfl
    @Input()
    set expressionFilter(filter: string) {
        this._expressionFilter = filter;
        this.filterFormulas();
    }

    get expressionFilter(): string {
        return this._expressionFilter;
    }


    get formulas(): XoFormula[] {
        return this._visibleFormulas;
    }


    private filterFormulas() {
        const formulas: XoFormula[] = this.formulaArea ? this.formulaArea.formulas : [];
        if (this.expressionFilter) {
            this._visibleFormulas = formulas.filter(value => value.expression.includes(this.expressionFilter));
        } else {
            this._visibleFormulas = formulas;
        }
    }


    static getInsertRequest(expression?: string, index?: number): XoInsertRequest {
        return new XoInsertFormulaRequest('', index !== undefined ? index : -1, expression ?? '');
    }


    addFormula(expression?: string, index?: number) {
        this.performAction({ type: ModellingActionType.insert, objectId: this.formulaArea.id, request: FormulaAreaComponent.getInsertRequest(expression ?? this.newFormulaExpression, index) });
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
