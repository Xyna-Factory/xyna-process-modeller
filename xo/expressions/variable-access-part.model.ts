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
import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray } from '@zeta/api';
import { XoExpression } from './expression.model';
import { XoExpressionVariable } from './expression-variable.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.expression', 'VariableAccessPart')
export class XoVariableAccessPart extends XoObject {


    @XoProperty()
    name: string;


    @XoProperty(XoExpression)
    indexDef: XoExpression;


    extractInvolvedVariable(): XoExpressionVariable[] {
        return this.indexDef?.extractInvolvedVariable() ?? [];
    }

    toString(): string {
        return this.name + (this.indexDef ? '[' + this.indexDef + ']' : '');
    }

}

@XoArrayClass(XoVariableAccessPart)
export class XoVariableAccessPartArray extends XoArray<XoVariableAccessPart> {
}
