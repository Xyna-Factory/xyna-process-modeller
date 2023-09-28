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
import { RuntimeContext, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoFormulaArea } from './formula-area.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertStepRequestContent } from './insert-step-request-content.model';
import { XoLabelArea } from './label-area.model';
import { XoModellingItem } from './modelling-item.model';
import { XoRuntimeInfo } from './runtime-info.model';
import { XoTextArea } from './text-area.model';
import { XoVariableArea } from './variable-area.model';


@XoObjectClass(XoModellingItem, 'xmcp.processmodeller.datatypes', 'Mapping')
export class XoMapping extends XoModellingItem {

    static readonly FORMULA_AREA_NAME = 'formulas';

    @XoProperty(XoVariableArea)
    @XoTransient()
    inputArea: XoVariableArea;

    @XoProperty(XoVariableArea)
    @XoTransient()
    outputArea: XoVariableArea;

    @XoProperty(XoFormulaArea)
    @XoTransient()
    formulaArea: XoFormulaArea;

    @XoProperty(XoLabelArea)
    @XoTransient()
    labelArea: XoLabelArea;

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
            } else if (area.name === XoModellingItem.LABEL_AREA_NAME) {
                this.labelArea = area as XoLabelArea;
            } else if (area.name === XoModellingItem.DOCUMENTATION_AREA_NAME) {
                this.documentationArea = area as XoTextArea;
            }
        }
    }


    setRuntimeInfo(value: XoRuntimeInfo) {
        super.setRuntimeInfo(value);

        // propagate runtime info to variable children
        [...this.inputArea.variables, ...this.outputArea.variables].forEach(variable => variable.setRuntimeInfo(value));
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertStepRequestContent();
        content.type = 'mapping';
        content.label = this.labelArea && this.labelArea.text ? this.labelArea.text : 'Mapping';
        return content;
    }


    static mapping(withLabel?: string): XoMapping {
        const result = new XoMapping();
        result.rtc = RuntimeContext.fromWorkspace('');
        result.inputArea = new XoVariableArea();
        result.outputArea = new XoVariableArea();
        result.formulaArea = new XoFormulaArea();
        result.labelArea = new XoLabelArea();
        result.labelArea.text = withLabel ? withLabel : 'Mapping';
        return result;
    }
}
