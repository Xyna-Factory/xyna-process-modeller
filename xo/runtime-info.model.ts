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
import { Xo, XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { BehaviorSubject, Observable } from 'rxjs/';


export interface IterationInfo {
    iterationContainerKey: string;
    iterationIndex: number;
}

export interface IterationInfoController {
    iterationInfoChange: Observable<IterationInfo>;
}



@XoObjectClass(null, 'xmcp.processmonitor.datatypes', 'RuntimeInfo')
export class XoRuntimeInfo extends XoObject {

    @XoProperty()
    id: string;

    /**
     * Inactive state is *false* in most cases.
     * It's only used inside iterations, wherein other iterations have to be inactive if one has been selected
     */
    private readonly _inactiveSubject = new BehaviorSubject<boolean>(false);



    private _iterationInfoController: IterationInfoController;

    iterationInfo: IterationInfo;   // only set if this is part of an iteration container



    protected get iterationInfoController(): IterationInfoController {
        return this._iterationInfoController;
    }


    setIterationInfoController(value: IterationInfoController) {
        this._iterationInfoController = value;
    }


    get inactive(): boolean {
        return this._inactiveSubject.value;
    }


    protected setInactive(value: boolean) {
        if (value !== this.inactive) {
            this._inactiveSubject.next(value);
        }
    }


    get inactiveChange(): Observable<boolean> {
        return this._inactiveSubject.asObservable();
    }


    hasError(): boolean {
        return false;
    }


    getInput(): Xo[] {
        // to be implemented by subclasses
        return undefined;
    }
}


@XoArrayClass(XoRuntimeInfo)
export class XoRuntimeInfoArray extends XoArray<XoRuntimeInfo> {
}
