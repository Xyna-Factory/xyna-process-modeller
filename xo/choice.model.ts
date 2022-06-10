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
import { XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoDistinction } from './distinction.model';
import { XoFormulaArea } from './formula-area.model';
import { XoModellingItem } from './modelling-item.model';


@XoObjectClass(XoDistinction, 'xmcp.processmodeller.datatypes.distinction', 'Choice')
export class XoChoice extends XoDistinction {

    @XoProperty(XoFormulaArea)
    @XoTransient()
    formulaArea: XoFormulaArea;


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoModellingItem.INPUT_AREA_NAME) {
                this.formulaArea = area as XoFormulaArea;

                // choice-formulas are conditions and thus don't allow assignments or void-functions
                this.formulaArea.formulas.forEach(formula => {
                    formula.allowAssign = false;
                    formula.allowVoidFunctions = false;
                });
            }
        }
    }
}


@XoArrayClass(XoChoice)
export class XoChoiceArray extends XoArray<XoChoice> {
}
