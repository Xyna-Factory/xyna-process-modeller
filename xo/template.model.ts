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
import { XoObjectClass, XoProperty, XoTransient, RuntimeContext } from '@zeta/api';

import { XoFormulaArea } from './formula-area.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertStepRequestContent } from './insert-step-request-content.model';
import { XoMapping } from './mapping.model';
import { XoModellingItem } from './modelling-item.model';
import { XoTextArea } from './text-area.model';
import { XoVariableArea } from './variable-area.model';


@XoObjectClass(XoModellingItem, 'xmcp.processmodeller.datatypes', 'Template')
export class XoTemplate extends XoModellingItem {

    @XoProperty(XoVariableArea)
    @XoTransient()
    inputArea: XoVariableArea;

    @XoProperty(XoVariableArea)
    @XoTransient()
    outputArea: XoVariableArea;

    @XoProperty(XoFormulaArea)
    @XoTransient()
    formulaArea: XoFormulaArea;

    @XoProperty(XoTextArea)
    @XoTransient()
    documentationArea: XoTextArea;


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoModellingItem.INPUT_AREA_NAME) {
                this.inputArea = area as XoVariableArea;
            } else if (area.name === XoMapping.FORMULA_AREA_NAME) {
                this.formulaArea = area as XoFormulaArea;
            } else if (area.name === XoModellingItem.OUTPUT_AREA_NAME) {
                this.outputArea = area as XoVariableArea;
            } else if (area.name === XoModellingItem.DOCUMENTATION_AREA_NAME) {
                this.documentationArea = area as XoTextArea;
            }
        }
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertStepRequestContent();
        content.type = 'template';
        content.label = 'Template';
        return content;
    }


    static template(): XoTemplate {
        const result = new XoTemplate();
        result.rtc = RuntimeContext.fromWorkspace('');
        result.inputArea = new XoVariableArea();
        result.outputArea = new XoVariableArea();
        result.formulaArea = new XoFormulaArea();
        return result;
    }
}
