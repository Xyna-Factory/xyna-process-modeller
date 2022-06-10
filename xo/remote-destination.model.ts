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

import { XoModellingItem } from './modelling-item.model';
import { XoVariableArea } from './variable-area.model';


@XoObjectClass(XoModellingItem, 'xmcp.processmodeller.datatypes', 'RemoteDestination')
export class XoRemoteDestination extends XoModellingItem {

    @XoProperty()
    name: string;

    @XoProperty()
    description: string;

    @XoProperty(XoVariableArea)
    @XoTransient()
    variableArea: XoVariableArea;


    afterDecode() {
        super.afterDecode();

        if (this.areas.length > 0) {
            this.variableArea = this.areas.data[0] as XoVariableArea;
        }
    }
}

@XoArrayClass(XoRemoteDestination)
export class XoRemoteDestinationArray extends XoArray<XoRemoteDestination> {
}
