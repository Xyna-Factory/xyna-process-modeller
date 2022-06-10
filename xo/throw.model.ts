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
import { RuntimeContext, XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoExceptionArea } from './exception-area.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertStepRequestContent } from './insert-step-request-content.model';
import { XoLabelArea } from './label-area.model';
import { XoModellingItem } from './modelling-item.model';
import { XoRuntimeInfo } from './runtime-info.model';
import { XoTextArea } from './text-area.model';
import { XoVariableArea } from './variable-area.model';


@XoObjectClass(XoModellingItem, 'xmcp.processmodeller.datatypes.exception', 'Throw')
export class XoThrow extends XoModellingItem {

    @XoProperty(XoExceptionArea)
    @XoTransient()
    exceptionArea: XoExceptionArea;

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
                this.exceptionArea = area as XoExceptionArea;
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
        this.exceptionArea.variables.forEach(variable => variable.setRuntimeInfo(value));
    }


    isSuccessorAllowed(): boolean {
        return false;
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertStepRequestContent();
        content.type = 'throw';
        content.label = this.labelArea && this.labelArea.text ? this.labelArea.text : 'Throw';
        return content;
    }


    static throw(withLabel?: string): XoThrow {
        const result = new XoThrow();
        result.rtc = RuntimeContext.fromWorkspace('');
        result.exceptionArea = new XoVariableArea();
        result.labelArea = new XoLabelArea();
        result.labelArea.text = withLabel ? withLabel : 'Throw';
        return result;
    }
}


@XoArrayClass(XoThrow)
export class XoThrowArray extends XoArray<XoThrow> {
}
