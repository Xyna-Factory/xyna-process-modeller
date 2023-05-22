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
import { ApiService, RuntimeContext, XoStructureObject } from '@zeta/api';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { XoData } from '../../data.model';
import { XoVariable } from '../../variable.model';
import { FormulaPart, ParsePartResult, StructuredPart } from './formula-part';


export class FormulaPartVariable extends FormulaPart implements StructuredPart {

    private readonly _variable: XoVariable;

    constructor(part: string, variable: XoVariable, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext) {
        super(part, predecessor, apiService, documentRTC);
        this._variable = variable;
    }

    isVariable(): boolean {
        return true;
    }

    get variable(): XoVariable {
        return this._variable;
    }

    hasMembers(): Observable<boolean> {
        return this.getStructure().pipe(
            map(structure => structure.children.length > 0)
        );
    }

    getStructure(): Observable<XoStructureObject> {
        const varRtc = this.variable ? this.variable.evaluatedRtc : null;
        const rtc =  varRtc ? varRtc.runtimeContext() : this.documentRTC ?? RuntimeContext.undefined;
        const fqn = this.variable ? this.variable.$fqn : '';
        return FormulaPart.getStructure(fqn, this.apiService, rtc, this.variable ? this.variable.root : null);
    }

    /**
     * Tries to parse this type of FormulaPart from the start of an expression, if matching
     * @param expression Expression to parse part from
     * @param variables Available variables
     * @returns Created FormulaPart instance (if one could be parsed) and new expression without parsed part
     */
    static parsePart(expression: string, variables: XoVariable[], predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext): ParsePartResult {
        // read number from part
        const matches = /^%(.*?)%/.exec(expression);
        if (matches && matches.length > 1) {
            const index = parseInt(matches[1], 10);
            const variable = (variables.length > index ? variables[index] : XoData.abstractData(matches[0]));
            return {
                part: new FormulaPartVariable(matches[0], variable, predecessor, apiService, documentRTC),
                parsedExpression: expression.substr(matches[0].length)
            };
        }
        return null;
    }
}
