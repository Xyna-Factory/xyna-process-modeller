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


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.expression', 'ModelledExpression')
export class XoModelledExpression extends XoObject {


    @XoProperty(XoExpression)
    sourceExpression: XoExpression = new XoExpression();


    @XoProperty(XoExpression)
    targetExpression: XoExpression = new XoExpression();


    toString(): string {
        return this.targetExpression.toString() + '=' + this.sourceExpression.toString();
    }

}

@XoArrayClass(XoModelledExpression)
export class XoModelledExpressionArray extends XoArray<XoModelledExpression> {
}
