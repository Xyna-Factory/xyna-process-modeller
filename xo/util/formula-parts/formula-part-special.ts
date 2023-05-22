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


export class FormulaPartSpecial extends FormulaPart {

    isSpecial(): boolean {
        // text must not be empty
        return !!this.text;
    }


    /**
     * Don't show { and } as text
     * Overridden
     */
    get text(): string {
        return this.part === '{' || this.part === '}' ? '' : this.part;
    }


    /**
     * Tries to parse this type of FormulaPart from the start of an expression, if matching
     * @param expression Expression to parse part from
     * @returns Created FormulaPart instance (if one could be parsed) and new expression without parsed part
     */
    static parsePart(expression: string, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext): ParsePartResult {
        // read function from part
        // starting with optional "."
        const matches = /^[()[\]{}.,¿?]|^null/.exec(expression);
        if (matches && matches.length > 0) {
            const part = matches[0];
            return {
                part: new FormulaPartSpecial(part, predecessor, apiService, documentRTC),
                parsedExpression: expression.substr(matches[0].length)
            };
        }
        return null;
    }


    static specialPartForKey(key: string, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext): FormulaPartSpecial {
        let formulaPart: FormulaPartSpecial = null;
        let part = null;
        if (key === '(' || key === ')' ||
            key === '[' || key === ']' ||
            key === ',' || key === '?') {
            part = key;
        } else if (key === '0') {
            part = 'null';
        }

        if (part) {
            formulaPart = new FormulaPartSpecial(part, predecessor, apiService, documentRTC);
        }
        return formulaPart;
    }
}
