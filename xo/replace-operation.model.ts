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
import { XoArray, XoArrayClass, XoObjectClass, XoProperty } from '@zeta/api';
import { XoDiffOperation } from './diff-operation.model';


@XoObjectClass(XoDiffOperation, 'xmcp.processmodeller.datatypes', 'ReplaceOperation')
export class XoReplaceOperation extends XoDiffOperation {

    @XoProperty()
    oldIds: string[];   // Ids of consecutive items to be replaced by this operation. Not necessarily with same amount as the replacing items


    constructor(_ident?: string) {
        super(_ident);

        this.kind = 'REPLACE_OPERATION';
    }


    static withOldIds(oldIds: string[]): XoReplaceOperation {
        const operation = new XoReplaceOperation();
        operation.oldIds = oldIds;
        return operation;
    }
}


@XoArrayClass(XoReplaceOperation)
export class XoReplaceOperationArray extends XoArray<XoReplaceOperation> {
}
