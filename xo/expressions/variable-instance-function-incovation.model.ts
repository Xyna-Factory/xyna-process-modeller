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
import { XoObjectClass, XoArrayClass, XoProperty, XoArray } from '@zeta/api';
import { XoVariableAccessPart } from './variable-access-part.model';
import { XoExpressionArray } from './expression.model';


@XoObjectClass(XoVariableAccessPart, 'xmcp.processmodeller.datatypes.expression', 'VariableInstanceFunctionIncovation')
export class XoVariableInstanceFunctionIncovation extends XoVariableAccessPart {


    @XoProperty(XoExpressionArray)
    functionParameter: XoExpressionArray = new XoExpressionArray();


}

@XoArrayClass(XoVariableInstanceFunctionIncovation)
export class XoVariableInstanceFunctionIncovationArray extends XoArray<XoVariableInstanceFunctionIncovation> {
}
