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

import { XoError } from './error.model';
import { XoRepairEntry, XoRepairEntryArray } from './repair-entry.model';


@XoObjectClass(XoError, 'xmcp.processmodeller.datatypes', 'RepairsRequiredError')
export class XoRepairsRequiredError extends XoError {

    @XoProperty(XoRepairEntryArray)
    repairs: XoRepairEntryArray;


    constructor(_ident?: string) {
        super(_ident);

        // Xo has to be instantiated such that class will not be not pruned on build
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const entry = new XoRepairEntry();
    }
}


@XoArrayClass(XoRepairsRequiredError)
export class XoRepairsRequiredErrorArray extends XoArray<XoRepairsRequiredError> {
}
