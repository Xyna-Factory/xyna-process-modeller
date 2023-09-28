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
import { RuntimeContext, XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertStepRequestContent } from './insert-step-request-content.model';
import { XoLabelArea } from './label-area.model';
import { XoModellingItem } from './modelling-item.model';
import { XoTextArea } from './text-area.model';
import { XoVariableArea } from './variable-area.model';


@XoObjectClass(XoModellingItem, 'xmcp.processmodeller.datatypes', 'Retry')
export class XoRetry extends XoModellingItem {

    @XoProperty(XoVariableArea)
    @XoTransient()
    inputArea: XoVariableArea;

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
            } else if (area.name === XoModellingItem.LABEL_AREA_NAME) {
                this.labelArea = area as XoLabelArea;
            } else if (area.name === XoModellingItem.DOCUMENTATION_AREA_NAME) {
                this.documentationArea = area as XoTextArea;
            }
        }
    }


    isSuccessorAllowed(): boolean {
        return false;
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertStepRequestContent();
        content.label = this.labelArea && this.labelArea.text ? this.labelArea.text : 'Retry';
        content.type = 'retry';
        return content;
    }


    static retry(withLabel?: string) {
        const result = new XoRetry();
        result.rtc = RuntimeContext.fromWorkspace('');
        result.inputArea = new XoVariableArea();
        result.labelArea = new XoLabelArea();
        result.labelArea.text = withLabel ? withLabel : 'Retry';
        return result;
    }
}


@XoArrayClass(XoRetry)
export class XoRetryArray extends XoArray<XoRetry> {
}
