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
import { XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoReferableObject } from './referable-object.model';
import { XoRuntimeInfo } from './runtime-info.model';


@XoObjectClass(XoReferableObject, 'xmcp.processmodeller.datatypes', 'Item')
export class XoItem extends XoReferableObject {

    @XoProperty()
    deletable = true;

    /**
     * Runtime Information, only set in Audit context
     */
    private _runtimeInfo: XoRuntimeInfo;

    /**
     * Is *true* if runtimeInfo is not available in context of an Audit
     * Remark: In PMOD context, runtimeInfo is not defined nor needed and shall thus not be handled as missing
     */
    @XoProperty()
    @XoTransient()
    missingRuntimeInfo = false;

    /**
     * Is called each time, this model is replaced by another one (instance doesn't change!)
     */
    // protected readonly replacedSubject = new Subject<XoItem>();


    // replaced(): Observable<XoItem> {
    //     return this.replacedSubject.asObservable();
    // }


    get runtimeInfo(): XoRuntimeInfo {
        return this._runtimeInfo;
    }


    setRuntimeInfo(value: XoRuntimeInfo) {
        this._runtimeInfo = value;
    }
}


@XoArrayClass(XoItem)
export class XoItemArray extends XoArray<XoItem> {

    setItems(items: XoItem[]) {
        (this._data as Array<XoItem>).splice(0, this.length, ...items);
    }
}
