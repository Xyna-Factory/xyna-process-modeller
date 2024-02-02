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
import { XoExpression1Arg } from './expression1-arg.model';
import { XoExpression } from './expression.model';
import { RecursiveStructure } from './comparable-path';
import { XoExpressionVariable } from './expression-variable.model';


@XoObjectClass(XoExpression1Arg, 'xmcp.processmodeller.datatypes.expression', 'NotExpression')
export class XoNotExpression extends XoExpression1Arg {


    @XoProperty(XoExpression)
    expression: XoExpression = new XoExpression();

    extractInvolvedVariable(): RecursiveStructure[] {
        return this.expression.extractInvolvedVariable();
    }

    extractFirstStructure(): RecursiveStructure {
        return this.expression.extractFirstStructure();
    }

    getFirstVariable(): XoExpressionVariable {
        return this.expression.getFirstVariable();
    }

    toString(): string {
        return '!' + this.expression.toString();
    }
}

@XoArrayClass(XoNotExpression)
export class XoNotExpressionArray extends XoArray<XoNotExpression> {
}
