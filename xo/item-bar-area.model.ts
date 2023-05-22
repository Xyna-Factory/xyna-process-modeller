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
import { XoArray, XoArrayClass, XoObjectClass } from '@zeta/api';

import { XoContainerArea } from './modelling-item.model';


@XoObjectClass(XoContainerArea, 'xmcp.processmodeller.datatypes', 'ItemBarArea')
export class XoItemBarArea extends XoContainerArea {

    // TODO: remove after fix of PMOD-3127
    afterDecode() {
        super.afterDecode();
        this.items.data.forEach(item => item.readonly = true);
    }
}


@XoArrayClass(XoItemBarArea)
export class XoItemBarAreaArray extends XoArray<XoItemBarArea> {
}
