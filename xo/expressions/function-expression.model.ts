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
import { XoExpressionVariable } from './expression-variable.model';
import { RecursiveStruckture, RekursiveStruckturePart } from './comparable-path';
import { XoVariable } from '../variable.model';
import { XoSingleVarExpression } from './single-var-expression.model';
import { XoLiteralExpression } from './literal-expression.model';


@XoObjectClass(XoExpression, 'xmcp.processmodeller.datatypes.expression', 'FunctionExpression')
export class XoFunctionExpression extends XoExpression implements RecursiveStruckture {


    @XoProperty(XoExpressionArray)
    subExpressions: XoExpressionArray = new XoExpressionArray();


    @XoProperty()
    function: string;


    @XoProperty(XoExpression)
    indexDef: XoExpression;


    @XoProperty(XoVariableAccessPartArray)
    parts: XoVariableAccessPartArray = new XoVariableAccessPartArray();


    extractInvolvedVariable(): RecursiveStruckture[] {
        if (this.function === 'cast') {
            return [this, ...this.getExpressionVariable().getContainingVariable(), ...this.subExpressions.data.flatMap(exp => exp.extractInvolvedVariable())];
        }
        return [...this.subExpressions.data.flatMap(exp => exp.extractInvolvedVariable()),  ...this.indexDef?.extractInvolvedVariable() ?? []];
    }


    private getExpressionVariable(): XoExpressionVariable {
        // is it allways a SingleVarExpression?
        return (this.subExpressions.data[1] as XoSingleVarExpression).variable;
    }


    getRecursiveStructure(): RekursiveStruckturePart {
        if (this.function === 'cast') {
            const root: RekursiveStruckturePart = this.getExpressionVariable().getRecursiveStructure();
            let next: RekursiveStruckturePart = root;
            while (next.child) {
                next = next.child;
            }
            next.fqn = (this.subExpressions.data[0] as XoLiteralExpression).value;
            this.parts.data.forEach(part => {
                next.child = new RekursiveStruckturePart(part.name);
                next = next.child;
                if (part.indexDef) {
                    next.child = new RekursiveStruckturePart('[' + part.indexDef.toString() + ']');
                    next = next.child;
                }
            });
            return root;
        }
        throw new Error('Wrong function');
    }


    getVariable(): XoExpressionVariable {
        if (this.function === 'cast') {
            this.getExpressionVariable();
        }
        throw new Error('Wrong function');
    }


    toString(): string {
        if (this.function === 'cast') {
            return this.castXFL();
        }
        return this.defaultXFL();
    }


    private defaultXFL(): string {
        return this.function +
        '(' + this.subExpressions.data.map(exp => exp.toString()).join(',') + ')' +
        (this.indexDef ? '[' + this.indexDef.toString() + ']' : '') +
        (this.parts && this.parts.length > 0 ? '.' + this.parts.data.map(part => part.toString()).join('.') : '');
    }


    // function = 'cast'. First argument is a stringLiteral containing the fqn to cast to. Second argument is Object wich has to cast.
    private castXFL(): string {
        return this.subExpressions.data[1] +
            '#cast(' +
            this.subExpressions.data[0] + ')' +
            (this.indexDef ? '[' + this.indexDef.toString() + ']' : '') +
            (this.parts && this.parts.length > 0 ? '.' + this.parts.data.map(part => part.toString()).join('.') : '');
    }
}

@XoArrayClass(XoFunctionExpression)
export class XoFunctionExpressionArray extends XoArray<XoFunctionExpression> {
}
