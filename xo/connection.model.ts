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
import { Xo, XoArray, XoArrayClass, XoClassInterfaceFrom, XoObject, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';


export enum DataConnectionType {
    auto = 'auto',
    ambigue = 'ambigue',
    user = 'user',
    none = 'none',
    constant = 'constant'
}


export function ConnectionTypeSeverity(type: DataConnectionType): number {
    switch (type) {
        case DataConnectionType.auto: return 0;
        case DataConnectionType.user: return 1;
        case DataConnectionType.constant: return 2;
        case DataConnectionType.ambigue: return 3;
        case DataConnectionType.none: return 4;
        default: return 0;
    }
}



@XoObjectClass(null, 'xmcp.processmodeller.datatypes', 'Connection')
export class XoConnection extends XoObject {

    @XoProperty()
    sourceId: string;

    @XoProperty()
    targetId: string;

    @XoProperty()
    branchId: string;

    // eslint-disable-next-line zeta/xo
    @XoProperty()
    type: DataConnectionType;

    @XoProperty()
    constant: string;

    @XoProperty()
    @XoTransient()
    constantObject: Xo;


    protected afterDecode() {
        super.afterDecode();

        if (this.constant) {
            const xoJson = JSON.parse(this.constant);

            this.constantObject = new (XoClassInterfaceFrom(xoJson))().decode(xoJson);
        }

        this.type = DataConnectionType[this.type.toLowerCase()];
    }
}


@XoArrayClass(XoConnection)
export class XoConnectionArray extends XoArray<XoConnection> {
}
