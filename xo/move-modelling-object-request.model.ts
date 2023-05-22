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

import { ModellingActionType } from '../api/xmom.service';
import { XoRequest } from './request.model';


@XoObjectClass(XoRequest, 'xmcp.processmodeller.datatypes.request', 'MoveModellingObjectRequest')
export class XoMoveModellingObjectRequest extends XoRequest {

    @XoProperty()
    index: number;

    @XoProperty()
    targetId: string;

    @XoProperty()
    relativePosition: string;

    @XoProperty()
    conflictHandling: string;

    @XoProperty()
    force: boolean;


    constructor(_ident?: string, index?: number, targetId?: string, relativePosition?: string, conflictHandling?: string, force?: boolean) {
        super(_ident);
        this.index = index;
        this.targetId = targetId;
        this.relativePosition = relativePosition;
        this.conflictHandling = conflictHandling;
        this.force = force;
    }


    invalidatesClipboard(type: ModellingActionType, objectId: string): boolean {
        return type === ModellingActionType.move && objectId.startsWith('clipboard');
    }
}
