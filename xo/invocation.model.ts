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

import { XoExceptionHandlingArea } from './exception-handling-area.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertServiceRequestContent } from './insert-service-request-content.model';
import { XoModellingItem } from './modelling-item.model';
import { XoOrderInputSourceArea } from './order-input-source-area.model';
import { XoRemoteDestinationArea } from './remote-destination-area.model';
import { XoRuntimeInfo } from './runtime-info.model';
import { XoService } from './service.model';
import { XoTextArea } from './text-area.model';
import { XoTypeLabelArea } from './type-label-area.model';
import { XoVariableArea } from './variable-area.model';
import { XoXmomItem } from './xmom-item.model';


@XoObjectClass(XoXmomItem, 'xmcp.processmodeller.datatypes.invocation', 'Invocation')
export class XoInvocation extends XoXmomItem {

    static readonly ORDER_INPUT_SOURCE_AREA_NAME = 'orderInputSources';
    static readonly REMOTE_DESTINATION_AREA_NAME = 'remoteDestination';

    @XoProperty()
    operation: string;

    @XoProperty()
    detached: boolean;

    @XoProperty()
    detachedTaggable: boolean;

    @XoProperty()
    freeCapacities: boolean;

    @XoProperty()
    freeCapacitiesTaggable: boolean;

    @XoProperty(XoOrderInputSourceArea)
    @XoTransient()
    orderInputSourceArea: XoOrderInputSourceArea;

    @XoProperty(XoRemoteDestinationArea)
    @XoTransient()
    remoteDestinationArea: XoRemoteDestinationArea;

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

    @XoProperty()
    @XoTransient()
    allowsOrderInputSource = false;


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoInvocation.ORDER_INPUT_SOURCE_AREA_NAME) {
                this.orderInputSourceArea = area as XoOrderInputSourceArea;
                this.orderInputSourceArea.id = this.id + '_ois'; // FIXME: server error (bug ...)
            } else if (area.name === XoInvocation.REMOTE_DESTINATION_AREA_NAME) {
                this.remoteDestinationArea = area as XoRemoteDestinationArea;
            } else if (area.name === XoModellingItem.INPUT_AREA_NAME) {
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

        // link branches from exception handling to each output variable, because the output depends on the branches
        if (this.outputArea) {
            this.outputArea.variables.forEach(variable => variable.providingBranches = this.exceptionHandlingArea?.getExceptionHandlingBranches() ?? []);
        }
    }


    setRuntimeInfo(value: XoRuntimeInfo) {
        super.setRuntimeInfo(value);

        // propagate runtime info to variable children
        [
            ...(this.inputArea ? this.inputArea.variables : []),
            ...(this.outputArea ? this.outputArea.variables : [])
        ].forEach(variable => variable.setRuntimeInfo(value));
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertServiceRequestContent();
        content.label = 'Service';
        content.isAbstract = true;
        return content;
    }


    static abstractInvocation(withLabel?: string): XoInvocation {
        const result = new XoInvocation();
        result.rtc = RuntimeContext.fromWorkspace('');
        result.inputArea = new XoVariableArea();
        result.outputArea = new XoVariableArea();
        result.typeLabelArea = new XoTypeLabelArea();
        result.typeLabelArea.text = withLabel ? withLabel : 'Service';
        return result;
    }
}
