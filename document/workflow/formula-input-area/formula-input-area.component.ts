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

import { coerceBoolean } from '@zeta/base';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoFormulaArea } from '../../../xo/formula-area.model';
import { XoFormula } from '../../../xo/formula.model';
import { XoInsertFormulaRequest } from '../../../xo/insert-formula-request.model';
import { XoModellingItem } from '../../../xo/modelling-item.model';
import { XoVariable, XoVariableArray } from '../../../xo/variable.model';
import { XoXmomItem } from '../../../xo/xmom-item.model';
import { ModDropEvent } from '../shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'formula-input-area',
    templateUrl: './formula-input-area.component.html',
    styleUrls: ['./formula-input-area.component.scss'],
    standalone: false
})
export class FormulaInputAreaComponent extends ModellingObjectComponent {

    private _questionmarkEditable = false;


    allowItem = (xoFqn: string): boolean => {
        const allowedType = !!this.formulaArea.itemTypes.find((itemType: string) => itemType.toLowerCase() === xoFqn.toLowerCase());
        return allowedType && !this.readonly;
    };


    canDrop = (xo: XoModellingItem): boolean =>
        xo instanceof XoXmomItem && !xo.isAbstract;


    dropped(event: ModDropEvent) {
        /**
         * This is a special case, where a variable (wrapped into a formula) can be dropped into a formula area.
         * This is only allowed, if the itemTypes of this formulaArea contain Data/Exception (checked by allowItem()).
         */
        const variable = event.item as XoVariable;
        if (variable) {
            if (variable.castToFqn) {
                variable.$fqn = variable.castToFqn;
            }
            this.performAction({
                request: new XoInsertFormulaRequest(undefined, -1, '%0%', new XoVariableArray().append(variable)),
                objectId: this.formulaArea.id,
                type: ModellingActionType.insert
            });
        }
    }


    @Input()
    set formulaArea(value: XoFormulaArea) {
        this.setModel(value);
    }

    get formulaArea(): XoFormulaArea {
        return this.getModel() as XoFormulaArea;
    }


    @Input()
    set questionmarkEditable(value: boolean) {
        this._questionmarkEditable = coerceBoolean(value);
    }

    get questionmarkEditable(): boolean {
        return this._questionmarkEditable;
    }


    get formula(): XoFormula {
        return this.formulaArea.items.length > 0 ? this.formulaArea.items.data[0] as XoFormula : null;
    }
}
