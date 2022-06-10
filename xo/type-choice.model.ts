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
import { RuntimeContext, XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoChoice } from './choice.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertStepRequestContent } from './insert-step-request-content.model';
import { XoItemBarArea } from './item-bar-area.model';


@XoObjectClass(XoChoice, 'xmcp.processmodeller.datatypes.distinction', 'TypeChoice')
export class XoTypeChoice extends XoChoice {
    static readonly UNUSED_TYPES_AREA = 'unusedTypes';

    @XoProperty(XoItemBarArea)
    @XoTransient()
    unusedTypesArea: XoItemBarArea;


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoTypeChoice.UNUSED_TYPES_AREA) {
                this.unusedTypesArea = area as XoItemBarArea;
            }
        }

        // branches of a Type Choice cannot be collapsed
        this.branches.forEach(branch => branch.collapsible = false);
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertStepRequestContent();
        content.type = 'typeChoice';
        return content;
    }


    static empty(): XoTypeChoice {
        const result = new XoTypeChoice();
        result.rtc = RuntimeContext.fromWorkspace('');
        return result;
    }
}


@XoArrayClass(XoTypeChoice)
export class XoTypeChoiceArray extends XoArray<XoTypeChoice> {
}
