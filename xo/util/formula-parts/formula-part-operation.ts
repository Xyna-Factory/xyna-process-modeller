/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
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


export class FormulaPartOperation extends FormulaPart {

    isOperation(): boolean {
        return true;
    }

    /**
     * @inheritdoc
     */
    merge(successor: FormulaPart): boolean {
        if (successor.isOperation()) {
            if (this.part === '>' && successor.part === '==') {
                this.setPart('>=');
                return true;
            }
            if (this.part === '<' && successor.part === '==') {
                this.setPart('<=');
                return true;
            }
            if (this.part === '=' && successor.part === '=') {
                this.setPart('==');
                return true;
            }
            if (this.part === '!' && successor.part === '==') {
                this.setPart('!=');
                return true;
            }
        }
        return false;
    }

    /**
     * Tries to parse this type of FormulaPart from the start of an expression, if matching
     * @param expression Expression to parse part from
     * @returns Created FormulaPart instance (if one could be parsed) and new expression without parsed part
     */
    static parsePart(expression: string, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext): ParsePartResult {
        // read operation from part
        const matches = /^(?:==|!=|~=|<=|>=|&&|\|\||[=+\-*/<>!])/.exec(expression);
        if (matches && matches.length > 0) {
            return {
                part: new FormulaPartOperation(matches[0], predecessor, apiService, documentRTC),
                parsedExpression: expression.substr(matches[0].length)
            };
        }
        return null;
    }

    static operationForKey(key: string, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext, allowAssign = true, allowCompare = true): FormulaPartOperation {
        let formulaPart: FormulaPartOperation = null;
        let part = null;
        switch (key) {
            case '=': part = allowAssign ? '=' : allowCompare ? '==' : null; break;
            case ':': part = allowAssign ? '=' : null; break;
            case '~': part = allowAssign ? '~=' : null; break;
            case '!': part = '!'; break;
            case '<': part = '<'; break;
            case '>': part = '>'; break;
            case '&': part = '&&'; break;
            case '|': part = '||'; break;
            case '+': part = '+'; break;
            case '-': part = '-'; break;
            case '*': part = '*'; break;
            case '/': part = '/'; break;
        }
        if (part) {
            formulaPart = new FormulaPartOperation(part, predecessor, apiService, documentRTC);
        }
        return formulaPart;
    }
}
