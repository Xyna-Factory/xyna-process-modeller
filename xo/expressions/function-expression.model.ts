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
import { XoExpression, XoExpressionArray } from './expression.model';
import { XoVariableAccessPartArray } from './variable-access-part.model';
import { RecursiveStructure } from './RecursiveStructurePart';
import { XoExpressionVariable } from './expression-variable.model';


@XoObjectClass(XoExpression, 'xmcp.processmodeller.datatypes.expression', 'FunctionExpression')
export class XoFunctionExpression extends XoExpression {


    @XoProperty(XoExpressionArray)
    subExpressions: XoExpressionArray = new XoExpressionArray();


    @XoProperty()
    function: string;


    @XoProperty(XoExpression)
    indexDef: XoExpression;


    @XoProperty(XoVariableAccessPartArray)
    parts: XoVariableAccessPartArray = new XoVariableAccessPartArray();


    extractInvolvedVariable(): RecursiveStructure[] {
        return [...this.subExpressions.data.flatMap(exp => exp.extractInvolvedVariable()), ...this.indexDef?.extractInvolvedVariable() ?? []];
    }

    extractFirstStructure(): RecursiveStructure {
        for (const exp of this.subExpressions) {
            const structure = exp.extractFirstStructure();
            if (structure) {
                return structure;
            }
        }
        return undefined;
    }

    getFirstVariable(): XoExpressionVariable {
        for (const exp of this.subExpressions) {
            const variable = exp.getFirstVariable();
            if (variable) {
                return variable;
            }
        }
        return undefined;
    }

    toString(): string {
        return this.function +
        '(' + this.subExpressions.data.map(exp => exp.toString()).join(',') + ')' +
        (this.indexDef ? '[' + this.indexDef.toString() + ']' : '') +
        (this.parts && this.parts.length > 0 ? '.' + this.parts.data.map(part => part.toString()).join('.') : '');
    }
}

@XoArrayClass(XoFunctionExpression)
export class XoFunctionExpressionArray extends XoArray<XoFunctionExpression> {
}
