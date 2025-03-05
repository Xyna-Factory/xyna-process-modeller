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

import { XoRequest } from './request.model';


@XoObjectClass(XoRequest, 'xmcp.processmodeller.datatypes.request', 'InsertFileRequest')
export class XoInsertFileRequest extends XoRequest {

    @XoProperty()
    content: { fileId: string; type: string };

    @XoProperty()
    index: number;


    constructor(_ident?: string, fileId = '', type = '', index = -1) {
        super(_ident);
        this.content = { fileId, type };
        this.index = index;
    }
}
