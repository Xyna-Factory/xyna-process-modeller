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
import { XoExpression } from './expression.model';
import { XoExpressionVariable } from './expression-variable.model';


@XoObjectClass(XoExpression, 'xmcp.processmodeller.datatypes.expression', 'Expression2Args')
export class XoExpression2Args extends XoExpression {


    @XoProperty(XoExpression)
    var1: XoExpression = new XoExpression();


    @XoProperty(XoExpression)
    var2: XoExpression = new XoExpression();


    @XoProperty()
    operator: string;


    extractInvolvedVariable(): XoExpressionVariable[] {
        return [...this.var1.extractInvolvedVariable(), ...this.var2.extractInvolvedVariable()];
    }

    toString(): string {
        return this.var1.toString() + this.operator + this.var2.toString();
    }

}

@XoArrayClass(XoExpression2Args)
export class XoExpression2ArgsArray extends XoArray<XoExpression2Args> {
}
