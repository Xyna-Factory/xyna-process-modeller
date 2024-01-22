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
import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray, XoTransient } from '@zeta/api';
import { XoVariableAccessPartArray } from './variable-access-part.model';
import { XoExpression } from './expression.model';
import { ComparablePath } from './comparable-path';
import { XoVariable } from '../variable.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.expression', 'ExpressionVariable')
export class XoExpressionVariable extends XoObject {


    @XoProperty()
    varNum: number;


    @XoProperty()
    @XoTransient()
    variable: XoVariable;


    @XoProperty(XoVariableAccessPartArray)
    parts: XoVariableAccessPartArray = new XoVariableAccessPartArray();


    @XoProperty(XoExpression)
    indexDef: XoExpression;


    extractInvolvedVariable(): XoExpressionVariable[] {
        return [this, ...this.parts.data.flatMap(part => part.extractInvolvedVariable()), ...this.indexDef?.extractInvolvedVariable() ?? []];
    }


    getRecursiveStructure(): ComparablePath {
        const root = new ComparablePath('%' + this.varNum.toString() + '%');
        let next = root;
        if (this.indexDef) {
            root.child = new ComparablePath('[' + this.indexDef.toString() + ']');
            next = root.child;
        }
        this.parts.data.forEach(part => {
            next.child = new ComparablePath(part.name);
            next = next.child;
            if (part.indexDef) {
                next.child = new ComparablePath('[' + part.indexDef.toString() + ']');
                next = next.child;
            }
        });

        return root;
    }

    toString(): string {
        return '%' + this.varNum + '%' +
            (this.indexDef ? '[' + this.indexDef.toString() + ']' : '') +
            (this.parts && this.parts.length > 0 ? '.' + this.parts.data.map(part => part.toString()).join('.') : '');
    }
}

@XoArrayClass(XoExpressionVariable)
export class XoExpressionVariableArray extends XoArray<XoExpressionVariable> {
}
