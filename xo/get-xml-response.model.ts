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
import { XoArray, XoArrayClass, XoObjectClass, XoProperty } from '@zeta/api';

import { XoResponse } from './response.model';


@XoObjectClass(XoResponse, 'xmcp.processmodeller.datatypes.response', 'GetXMLResponse')
export class XoGetXMLResponse extends XoResponse {


    @XoProperty()
    current: string;

    @XoProperty()
    saved: string;

    @XoProperty()
    deploy: string;
}

@XoArrayClass(XoGetXMLResponse)
export class XoGetXMLResponseArray extends XoArray<XoGetXMLResponse> {
}
