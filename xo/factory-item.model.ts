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
import { XmomObjectType } from '@pmod/api/xmom-types';
import { FullQualifiedName, RuntimeContext, XoArray, XoArrayClass, XoEnumerated, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoRuntimeContext as XoRuntimeContextProcessModeller } from './runtime-context.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes', 'FactoryItem')
export class XoFactoryItem extends XoObject {

    @XoProperty()
    @XoEnumerated(Object.keys(XmomObjectType).map(key => XmomObjectType[key]))
    type: string;

    @XoProperty(XoRuntimeContextProcessModeller)
    $rtc: XoRuntimeContextProcessModeller;

    @XoProperty()
    $fqn: string;

    @XoProperty()
    label: string;


    toRtc(): RuntimeContext {
        return this.$rtc
            ? this.$rtc.runtimeContext()
            : RuntimeContext.undefined;
    }


    toFqn(): FullQualifiedName {
        return this.$fqn
            ? FullQualifiedName.decode(this.$fqn)
            : FullQualifiedName.undefined;
    }
}


@XoArrayClass(XoFactoryItem)
export class XoFactoryItemArray extends XoArray<XoFactoryItem> {
}
