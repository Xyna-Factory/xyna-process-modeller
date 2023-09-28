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
import { ApiService, RuntimeContext } from '@zeta/api';

import { FormulaPart, ParsePartResult } from './formula-part';


export class FormulaPartLiteral extends FormulaPart {

    private _literal: string;


    constructor(part: string, literal: string, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext) {
        super(part, predecessor, apiService, documentRTC);
        this._literal = FormulaPartLiteral.decode(literal);
    }


    isLiteral(): boolean {
        return true;
    }


    get text(): string {
        return this._literal;
    }


    set text(value: string) {
        if (this.text !== value) {
            this._literal = value;
            this.setPart(`"${FormulaPartLiteral.encode(value)}"`);
        }
    }


    private static encode(value: string): string {
        // escape \
        value = value.replace(/\\/g, '\\\\');

        // escape "
        value = value.replace(/"/g, '\\"');
        return value;
    }


    private static decode(value: string): string {
        // unescape "
        value = value.replace(/\\"/g, '"');

        // unescape \
        value = value.replace(/\\\\/g, '\\');
        return value;
    }


    /**
     * Tries to parse this type of FormulaPart from the start of an expression, if matching
     * @param expression Expression to parse part from
     * @returns Created FormulaPart instance (if one could be parsed) and new expression without parsed part
     */
    static parsePart(expression: string, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext): ParsePartResult {
        // read operation from part
        const matches = /^"((?:\\.|[^"\\])*)"/.exec(expression);
        if (matches && matches.length > 1) {
            return {
                part: new FormulaPartLiteral(matches[0], matches[1], predecessor, apiService, documentRTC),
                parsedExpression: expression.substr(matches[0].length)
            };
        }
        return null;
    }
}
