/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { XoObjectClass, XoArrayClass, XoArray } from '@zeta/api';
import { XoContainerArea } from './modelling-item.model';
import { XoMetaTag } from './meta-tag.model';


@XoObjectClass(XoContainerArea, 'xmcp.processmodeller.datatypes', 'MetaTagArea')
export class XoMetaTagArea extends XoContainerArea {


    get metaTags(): XoMetaTag[] {
        return this.items.data as XoMetaTag[];
    }


}

@XoArrayClass(XoMetaTagArea)
export class XoMetaTagAreaArray extends XoArray<XoMetaTagArea> {
}