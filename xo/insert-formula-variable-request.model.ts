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
import { XoObjectClass, XoProperty } from '@zeta/api';

import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertRequest } from './insert-request.model';
import { XoVariable } from './variable.model';


@XoObjectClass(XoInsertRequest, 'xmcp.processmodeller.datatypes.request', 'InsertFormulaVariableRequest')
export class XoInsertFormulaVariableRequest extends XoInsertRequest {

    @XoProperty(XoInsertRequestContent)
    content: XoInsertRequestContent;


    constructor(_ident?: string, index?: number, item?: XoVariable) {
        super(_ident, index);
        this.content = item.createInsertRequestContent();
    }
}
