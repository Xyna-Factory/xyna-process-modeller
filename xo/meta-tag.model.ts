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
import { XoObjectClass, XoArrayClass, XoProperty, XoArray } from '@zeta/api';
import { XoItem } from './item.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertMetaTagRequestContent } from './insert-meta-tag-request-content.model';


@XoObjectClass(XoItem, 'xmcp.processmodeller.datatypes', 'MetaTag')
export class XoMetaTag extends XoItem {


    @XoProperty()
    tag: string;


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertMetaTagRequestContent();
        content.tag = this.tag;
        return content;
    }
}

@XoArrayClass(XoMetaTag)
export class XoMetaTagArray extends XoArray<XoMetaTag> {
}
