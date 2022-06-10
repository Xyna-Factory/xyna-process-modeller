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
import { FullQualifiedName, XoObjectClass, XoProperty } from '@zeta/api';

import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertServiceRequestContent } from './insert-service-request-content.model';
import { XoInvocation } from './invocation.model';


@XoObjectClass(XoInvocation, 'xmcp.processmodeller.datatypes.invocation', 'MethodInvocation')
export class XoMethodInvocation extends XoInvocation {

    @XoProperty()
    service: string;


    toFqn(): FullQualifiedName {
        const base = super.toFqn();
        return base.name
            ? FullQualifiedName.fromPathName(base.path, base.name, this.operation)
            : base;
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertServiceRequestContent();
        content.label = this.label;
        content.$fqn = this.$fqn;
        content.service = this.service ? this.service : FullQualifiedName.decode(this.$fqn).name;
        content.operation = this.operation;
        return content;
    }
}
