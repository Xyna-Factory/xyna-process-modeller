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
import { XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoBranch } from './branch.model';
import { XoCompensation, XoCompensationArray } from './compensation.model';
import { XoExceptionHandling, XoExceptionHandlingArray } from './exception-handling.model';
import { XoItem } from './item.model';
import { XoContainerArea } from './modelling-item.model';


@XoObjectClass(XoContainerArea, 'xmcp.processmodeller.datatypes.exception', 'ExceptionHandlingArea')
export class XoExceptionHandlingArea extends XoContainerArea {

    @XoProperty(XoExceptionHandlingArray)
    @XoTransient()
    exceptionHandlings: XoExceptionHandlingArray = new XoExceptionHandlingArray();

    @XoProperty(XoCompensationArray)
    @XoTransient()
    compensations: XoCompensationArray = new XoCompensationArray();


    hasHandledExceptions(): boolean {
        return !!this.exceptionHandlings.data.find(exceptionHandling => exceptionHandling.hasHandledExceptions());
    }


    hasCompensations(): boolean {
        return this.compensations.length > 0 && this.compensations.data[0]?.overriddenDefaultCompensation;
    }


    auditExceptionHandlingsMissingRuntimeInfo(): boolean {
        return !!this.getExceptionHandlingBranches().every(item => item.missingRuntimeInfo);
    }


    auditCompensationsMissingRuntimeInfo(): boolean {
        return !!this.getCompensationItems().every(item => item.missingRuntimeInfo);
    }


    getExceptionHandlingBranches(): XoBranch[] {
        const branches: XoBranch[] = [];
        this.exceptionHandlings.data.forEach(exceptionHandling => branches.push(...exceptionHandling.branches));
        return branches;
    }


    getCompensationItems(): XoItem[] {
        const items: XoItem[] = [];
        this.compensations.data.forEach(compensation => items.push(...compensation.items));
        return items;
    }


    afterDecode() {
        super.afterDecode();

        this.items.data.forEach(errorItem => {
            if (errorItem instanceof XoExceptionHandling) {
                this.exceptionHandlings.data.push(errorItem);
            } else if (errorItem instanceof XoCompensation) {
                this.compensations.data.push(errorItem);
            }
        });

        // FIXME As long as backend does not assign an ID for this area, use the one from its first child
        // see PMOD-2803
        this.id ??= (this.items.data[0]?.id ?? '') + '_container';

        // FIXME As long as backend does not assign an ID for the compensation area, assemble one from this area's ID
        // see PMOD-2803
        this.compensations?.data.forEach((compensation: XoCompensation, i: number) =>
            compensation.id ??= this.id + '_compensation'
        );
    }
}


@XoArrayClass(XoExceptionHandlingArea)
export class XoExceptionHandlingAreaArray extends XoArray<XoExceptionHandlingArea> {
}
