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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoModellingItem } from './modelling-item.model';
import { XoRuntimeContext } from './runtime-context.model';


export interface XoClipboardEntryData {
    $clipboard?: {
        originalRtc: XoRuntimeContext;
        originalFqn: string;
    };
}


@XoObjectClass(null, 'xmcp.processmodeller.datatypes', 'ClipboardEntry')
export class XoClipboardEntry extends XoObject {

    @XoProperty(XoRuntimeContext)
    originalRtc: XoRuntimeContext;

    @XoProperty()
    originalFqn: string;

    @XoProperty(XoModellingItem)
    item: XoModellingItem;


    afterDecode() {
        if (this.item) {
            const data: XoClipboardEntryData = this.item.data as XoClipboardEntryData;
            data.$clipboard = {
                originalRtc: this.originalRtc,
                originalFqn: this.originalFqn
            };
        }
    }
}


@XoArrayClass(XoClipboardEntry)
export class XoClipboardEntryArray extends XoArray<XoClipboardEntry> {
}
