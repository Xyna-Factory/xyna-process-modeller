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

import { DataConnectionType } from './connection.model';
import { XoRequest } from './request.model';


@XoObjectClass(XoRequest, 'xmcp.processmodeller.datatypes.request', 'SetDataflowConnectionRequest')
export class XoSetDataflowConnectionRequest extends XoRequest {

    @XoProperty()
    sourceId: string;

    @XoProperty()
    targetId: string;

    @XoProperty()
    branchId: string;

    // eslint-disable-next-line zeta/xo
    @XoProperty()
    type: DataConnectionType;


    constructor(_ident?: string, sourceId?: string, targetId?: string, type?: DataConnectionType, revision?: number, branchId?: string) {
        super(_ident);

        this.sourceId = sourceId;
        this.targetId = targetId;
        this.type = type;
        this.revision = revision;
        this.branchId = branchId;
    }
}
