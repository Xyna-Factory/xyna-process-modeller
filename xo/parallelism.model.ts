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

import { XoContentArea } from './content-area.model';
import { XoModellingItem } from './modelling-item.model';


@XoObjectClass(XoModellingItem, 'xmcp.processmodeller.datatypes', 'Parallelism')
export class XoParallelism extends XoModellingItem {

    @XoProperty(XoContentArea)
    @XoTransient()
    contentArea: XoContentArea;


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoModellingItem.CONTENT_AREA_NAME) {
                this.contentArea = area as XoContentArea;
            }
        }

        // branches of a Parallelism cannot be collapsed
        const branches = this.contentArea?.items?.data as Array<XoBranch> ?? [];
        branches.forEach(branch => branch.collapsible = false);
    }
}


@XoArrayClass(XoParallelism)
export class XoParallelismArray extends XoArray<XoParallelism> {
}
