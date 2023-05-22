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
import { RuntimeContext, XoArray, XoArrayClass, XoObjectClass } from '@zeta/api';

import { XoChoice } from './choice.model';
import { XoContentArea } from './content-area.model';
import { XoFormulaArea } from './formula-area.model';
import { XoFormula } from './formula.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertStepRequestContent } from './insert-step-request-content.model';
import { XoVariableArea } from './variable-area.model';


@XoObjectClass(XoChoice, 'xmcp.processmodeller.datatypes.distinction', 'ConditionalBranching')
export class XoConditionalBranching extends XoChoice {


    afterDecode() {
        super.afterDecode();

        // link branches to each output variable, because the output depends on the branches
        if (this.outputArea) {
            this.outputArea.variables.forEach(variable => variable.providingBranches = this.branches);
        }
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertStepRequestContent();
        content.type = 'conditionalBranching';
        return content;
    }


    static empty(): XoConditionalBranching {
        const result = new XoConditionalBranching();
        result.rtc = RuntimeContext.fromWorkspace('');
        result.formulaArea = new XoFormulaArea();
        result.formulaArea.items.append(XoFormula.emptyFormula());
        result.contentArea = new XoContentArea();
        result.outputArea = new XoVariableArea();
        return result;
    }
}


@XoArrayClass(XoConditionalBranching)
export class XoConditionalBranchingArray extends XoArray<XoConditionalBranching> {
}
