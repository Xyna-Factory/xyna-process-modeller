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
import { XoObjectClass, XoArrayClass, XoProperty, XoArray, XoTransient } from '@zeta/api';
import { XoContentArea } from './content-area.model';
import { XoItem } from './item.model';


export interface HasStorablePropertyArea {
    storablePropertyArea: XoStorablePropertyArea;
}


@XoObjectClass(XoContentArea, 'xmcp.processmodeller.datatypes.datatypemodeller', 'StorablePropertyArea')
export class XoStorablePropertyArea extends XoContentArea {

    @XoProperty()
    fieldName: string;

    @XoProperty()
    isReference: boolean;

    @XoProperty()
    isIndex: boolean;

    @XoProperty()
    isUnique: boolean;

    @XoProperty()
    isFlattened: boolean;

    @XoProperty()
    @XoTransient()
    label: string;

    children: XoStorablePropertyArea[];


    protected afterDecode() {
        super.afterDecode();

        this.children = this.items.data
            .filter(item => !!(item as XoItem & HasStorablePropertyArea).storablePropertyArea)
            .map((item: XoItem & HasStorablePropertyArea) => item.storablePropertyArea);
    }
}


@XoArrayClass(XoStorablePropertyArea)
export class XoStorablePropertyAreaArray extends XoArray<XoStorablePropertyArea> {
}
