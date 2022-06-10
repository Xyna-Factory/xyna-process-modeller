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
import { Xo, XoArray, XoArrayClass, XoClassInterfaceFrom, XoObject, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';


export enum ConnectionType {
    auto = 'auto',
    ambigue = 'ambigue',
    user = 'user',
    none = 'none',
    constant = 'constant'
}


export function ConnectionTypeSeverity(type: ConnectionType): number {
    switch (type) {
        case ConnectionType.auto: return 0;
        case ConnectionType.user: return 1;
        case ConnectionType.constant: return 2;
        case ConnectionType.ambigue: return 3;
        case ConnectionType.none: return 4;
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
    type: ConnectionType;

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

        this.type = ConnectionType[this.type.toLowerCase()];
    }
}


@XoArrayClass(XoConnection)
export class XoConnectionArray extends XoArray<XoConnection> {
}
