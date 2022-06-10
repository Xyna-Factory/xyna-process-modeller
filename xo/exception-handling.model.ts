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

import { XoDistinction } from './distinction.model';
import { XoItemBarArea } from './item-bar-area.model';


@XoObjectClass(XoDistinction, 'xmcp.processmodeller.datatypes.distinction', 'ExceptionHandling')
export class XoExceptionHandling extends XoDistinction {
    static readonly UNHANDLED_EXCEPTION_AREA = 'unhandledExceptions';

    @XoProperty(XoItemBarArea)
    @XoTransient()
    unhandledExceptionsArea: XoItemBarArea;


    hasHandledExceptions(): boolean {
        return this.contentArea.items.length > 0;
    }


    hasUnhandledExceptions(): boolean {
        return this.unhandledExceptionsArea && this.unhandledExceptionsArea.items.length > 0;
    }


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoExceptionHandling.UNHANDLED_EXCEPTION_AREA) {
                this.unhandledExceptionsArea = area as XoItemBarArea;
            }
        }

        // branches of an Exception Handling cannot be collapsed
        this.branches.forEach(branch => branch.collapsible = false);
    }
}


@XoArrayClass(XoExceptionHandling)
export class XoExceptionHandlingArray extends XoArray<XoExceptionHandling> {
}
