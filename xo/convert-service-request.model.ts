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
import { XoObjectClass, XoProperty } from '@zeta/api';

import { ConversionTarget, XoConvertRequest } from './convert-request.model';


@XoObjectClass(XoConvertRequest, 'xmcp.processmodeller.datatypes.request', 'ConvertServiceRequest')
export class XoConvertServiceRequest extends XoConvertRequest {

    @XoProperty()
    label: string;

    @XoProperty()
    path: string;


    static convertToWorkflow(result: {label: string; path: string}): XoConvertServiceRequest {
        const req = new XoConvertServiceRequest();
        req.label = result.label;
        req.path = result.path;
        req.targetType = ConversionTarget.workflow;
        return req;
    }


    static convertToMapping(): XoConvertServiceRequest {
        const req = new XoConvertServiceRequest();
        req.targetType = ConversionTarget.mapping;
        return req;
    }
}
