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
import { XoItem, XoItemArray } from './item.model';

import { XoReferableObject } from './referable-object.model';


@XoObjectClass(XoReferableObject, 'xmcp.processmodeller.datatypes', 'XMOMItemUpdate')
export class XoXmomItemUpdate extends XoReferableObject {

    @XoProperty(XoDiffOperation)
    diffOperation: XoDiffOperation;

    @XoProperty(XoItemArray)
    items: XoItemArray;

    static withParams(operation: XoDiffOperation, items: XoItem[]): XoXmomItemUpdate {
        const update = new XoXmomItemUpdate();
        update.diffOperation = operation;
        update.items = new XoItemArray();
        update.items.data.splice(0, 0, ...items);
        return update;
    }
}


@XoArrayClass(XoXmomItemUpdate)
export class XoXmomItemUpdateArray extends XoArray<XoXmomItemUpdate> {
}
