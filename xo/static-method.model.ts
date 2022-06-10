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
import { XoArray, XoArrayClass, XoObjectClass } from '@zeta/api';

import { XoInsertMemberServiceRequestContent } from './insert-member-service-request-content.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoMethod } from './method.model';


@XoObjectClass(XoMethod, 'xmcp.processmodeller.datatypes.datatypemodeller', 'StaticMethod')
export class XoStaticMethod extends XoMethod {

    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertMemberServiceRequestContent();
        // changing the type makes it much easier for the backend to differ between dynamic and static methods
        content.type = 'memberService';
        content.label = this.label || 'Service';
        content.implementation = this.implementation;
        content.implementationType = this.implementationType;
        content.reference = null;

        return content;
    }
}


@XoArrayClass(XoStaticMethod)
export class XoStaticMethodArray extends XoArray<XoStaticMethod> {
}
