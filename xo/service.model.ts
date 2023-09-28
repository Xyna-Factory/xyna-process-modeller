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
import { XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoExceptionHandlingArea } from './exception-handling-area.model';
import { XoModellingItem } from './modelling-item.model';
import { XoRuntimeInfo } from './runtime-info.model';
import { XoTextArea } from './text-area.model';
import { XoTypeLabelArea } from './type-label-area.model';
import { XoVariableArea } from './variable-area.model';
import { XoXmomItem } from './xmom-item.model';


@XoObjectClass(XoXmomItem, 'xmcp.processmodeller.datatypes', 'Service')
export class XoService extends XoXmomItem {
    static readonly EXCEPTION_HANDLING_AREA_NAME = 'errorHandling';

    @XoProperty(XoVariableArea)
    @XoTransient()
    inputArea: XoVariableArea;

    @XoProperty(XoVariableArea)
    @XoTransient()
    outputArea: XoVariableArea;

    @XoProperty(XoTypeLabelArea)
    @XoTransient()
    typeLabelArea: XoTypeLabelArea;

    @XoProperty(XoTextArea)
    @XoTransient()
    documentationArea: XoTextArea;

    @XoProperty(XoExceptionHandlingArea)
    @XoTransient()
    exceptionHandlingArea: XoExceptionHandlingArea;


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoModellingItem.INPUT_AREA_NAME) {
                this.inputArea = area as XoVariableArea;
            } else if (area.name === XoModellingItem.OUTPUT_AREA_NAME) {
                this.outputArea = area as XoVariableArea;
            } else if (area.name === XoModellingItem.LABEL_AREA_NAME) {
                this.typeLabelArea = area as XoTypeLabelArea;
            } else if (area.name === XoModellingItem.DOCUMENTATION_AREA_NAME) {
                this.documentationArea = area as XoTextArea;
            } else if (area.name === XoService.EXCEPTION_HANDLING_AREA_NAME) {
                this.exceptionHandlingArea = area as XoExceptionHandlingArea;
            }
        }

        /** @todo Remove as soon as backend gives an id for typeLabelArea */
        if (this.typeLabelArea && !this.typeLabelArea.id) {
            this.typeLabelArea.id = this.id;
        }
    }


    setRuntimeInfo(value: XoRuntimeInfo) {
        super.setRuntimeInfo(value);

        // propagate runtime info to variable children
        [...this.inputArea.variables, ...this.outputArea.variables].forEach(variable => variable.setRuntimeInfo(value));
    }
}
