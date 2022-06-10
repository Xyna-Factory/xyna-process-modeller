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
import { RuntimeContext, XoArrayClass, XoObjectClass, XoProperty } from '@zeta/api';

import { XmomObjectType } from '../api/xmom-types';
import { XoVariable, XoVariableArray } from './variable.model';


@XoObjectClass(XoVariable, 'xmcp.processmodeller.datatypes', 'Data')
export class XoData extends XoVariable {

    @XoProperty()
    isThisArgument = false;


    constructor(_ident?: string) {
        super(_ident);
        this.type = XmomObjectType.DataType;
    }


    static abstractData(withName?: string): XoData {
        const result = new XoData();
        result.rtc = RuntimeContext.fromWorkspace('');
        result.label = withName || 'Data Type';
        result.isAbstract = true;
        return result;
    }
}


@XoArrayClass(XoData)
export class XoDataArray extends XoVariableArray<XoData> {
}
