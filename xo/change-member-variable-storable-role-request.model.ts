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


/**
 * Change text of an Area
 * @see XoChangeLabelRequest for changing the label of an Item
 */
@XoObjectClass(XoRequest, 'xmcp.processmodeller.datatypes.request', 'ChangeMemberVariableStorableRoleRequest')
export class XoChangeMemberVariableStorableRoleRequest extends XoRequest {

    @XoProperty()
    storableRole: string;


    constructor(_ident?: string, value?: string) {
        super(_ident);
        this.storableRole = value;
    }
}
