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
import { XoObjectClass, XoArrayClass, XoObject, XoArray } from '@zeta/api';
import { RecursiveStructure } from './RecursiveStructurePart';
import { XoExpressionVariable } from './expression-variable.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.expression', 'Expression')
export class XoExpression extends XoObject {

    extractInvolvedVariable(): RecursiveStructure[] {
        return [];
    }

    extractFirstStructure(): RecursiveStructure {
        return undefined;
    }

    getFirstVariable(): XoExpressionVariable {
        return undefined;
    }

    toString(): string {
        return '';
    }

}

@XoArrayClass(XoExpression)
export class XoExpressionArray extends XoArray<XoExpression> {
}
