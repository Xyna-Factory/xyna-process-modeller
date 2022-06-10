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
import { ApiService, RuntimeContext, XoStructureObject } from '@zeta/api';

import { Observable } from 'rxjs/';
import { map } from 'rxjs/operators';

import { XoReferableObject } from '../../referable-object.model';
import { FormulaPart, ParsePartResult, StructuredPart } from './formula-part';


export enum FormulaFunctionGroup {
    allButGlob,
    none,
    glob
}


export interface FormulaFunctionDeclaration {
    label: string;
    xfl: string;
}


export class FormulaPartFunction extends FormulaPart implements StructuredPart {

    static readonly APPEND          = { label: 'append()',          xfl: 'append(' };
    static readonly AS_XFL          = { label: 'as XFL()',          xfl: 'asxflexpression(' };
    static readonly CONCAT_LISTS    = { label: 'concat lists()',    xfl: 'concatlists(' };
    static readonly CONCAT          = { label: 'concat()',          xfl: 'concat(' };
    static readonly CONTAINS        = { label: 'contains()',        xfl: 'contains(' };
    static readonly ENDS_WITH       = { label: 'ends with()',       xfl: 'endswith(' };
    static readonly INDEX_OF        = { label: 'index of()',        xfl: 'indexof(' };
    static readonly TYPE_OF         = { label: 'type of()',         xfl: 'typeof(' };
    static readonly LENGTH          = { label: 'length()',          xfl: 'length(' };
    static readonly LOWERCASE       = { label: 'lowercase()',       xfl: 'tolowercase(' };
    static readonly MATCH           = { label: 'match()',           xfl: 'matches(' };
    static readonly NEW             = { label: 'new()',             xfl: 'new(' };
    static readonly REPLACE_ALL     = { label: 'replace all()',     xfl: 'replaceall(' };
    static readonly STARTS_WITH     = { label: 'starts with()',     xfl: 'startswith(' };
    static readonly SUBSTRING       = { label: 'substring()',       xfl: 'substring(' };
    static readonly UPPERCASE       = { label: 'uppercase()',       xfl: 'touppercase(' };
    static readonly XPATH           = { label: 'xpath()',           xfl: 'xpath(' };
    static readonly CAST            = { label: 'cast()',            xfl: '#cast(' };
    static readonly GLOB            = { label: 'glob()',            xfl: 'glob(' };

    static readonly FUNCTIONS_WO_GLOB = [ FormulaPartFunction.APPEND, FormulaPartFunction.AS_XFL, FormulaPartFunction.CONCAT_LISTS,
        FormulaPartFunction.CONCAT, FormulaPartFunction.CONTAINS, FormulaPartFunction.ENDS_WITH, FormulaPartFunction.INDEX_OF,
        FormulaPartFunction.TYPE_OF, FormulaPartFunction.LENGTH, FormulaPartFunction.LOWERCASE, FormulaPartFunction.MATCH,
        FormulaPartFunction.NEW, FormulaPartFunction.REPLACE_ALL, FormulaPartFunction.STARTS_WITH, FormulaPartFunction.SUBSTRING,
        FormulaPartFunction.UPPERCASE, FormulaPartFunction.XPATH, FormulaPartFunction.CAST
    ];

    static functionsForGroup(group: FormulaFunctionGroup): FormulaFunctionDeclaration[] {
        switch (group) {
            case FormulaFunctionGroup.allButGlob:   return FormulaPartFunction.FUNCTIONS_WO_GLOB;
            case FormulaFunctionGroup.glob:         return [ FormulaPartFunction.GLOB ];
        }
        return [];
    }



    private parameter: string;
    private root: XoReferableObject;

    isFunction(): boolean {
        return true;
    }

    isFunctionReturningVariable(): boolean {
        return (this.part.startsWith('#cast') || this.part.startsWith('new'));
    }

    /** A little confusing: Returns **true**, if returned variable has members */
    hasMembers(): Observable<boolean> {
        return this.getStructure().pipe(
            map(structure => structure.children.length > 0)
        );
    }

    getStructure(): Observable<XoStructureObject> {
        if (this.isFunctionReturningVariable()) {
            const fqn = this.parameter;
            return FormulaPart.getStructure(fqn, this.apiService, this.documentRTC, this.root);
        }
        return null;
    }

    /**
     * Tries to parse this type of FormulaPart from the start of an expression, if matching
     * @param expression Expression to parse part from
     * @returns Created FormulaPart instance (if one could be parsed) and new expression without parsed part
     */
    static parsePart(expression: string, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext): ParsePartResult {
        // read function from part
        // starting with optional "."
        const matches = /^([a-zA-Z_#][a-zA-Z0-9_]*)\(/.exec(expression);
        if (matches && matches.length > 1) {
            const functionPart = new FormulaPartFunction(matches[1], predecessor, apiService, documentRTC);
            // parse parameter
            const parameterMatch = /^([a-zA-Z_#][a-zA-Z0-9_]*)\("([^"]*)"/.exec(expression);
            if (parameterMatch && parameterMatch.length > 2) {
                functionPart.parameter = parameterMatch[2];
            }
            return {
                part: functionPart,
                parsedExpression: expression.substr(matches[0].length - 1)  // leave last "(" in expression
            };
        }
        return null;
    }

    static functionForKey(key: string, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext, altKey: boolean, allowAssign: boolean, allowedFunctions: FormulaFunctionGroup, root: XoReferableObject): FormulaPartFunction {
        let formulaPart: FormulaPartFunction = null;
        let part = null;

        // handling inputs for Mac OS X as preprocessing for the general handling
        switch (key) {
            case 'å': key = 'a'; altKey = true; break;
            case '∆': key = 'k'; altKey = true; break;
            case '⁄': key = 'i'; altKey = true; break;
            case '@': key = 'l'; altKey = true; break;
            case '‚': key = 's'; altKey = true; break;
            case '≈': key = 'x'; altKey = true; break;
        }
        // handle general inputs
        switch (key) {
            case 'a': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? (altKey && allowAssign) ? FormulaPartFunction.APPEND.xfl : FormulaPartFunction.CAST.xfl
                : null;
                break;
            case 'k': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? (altKey && allowAssign) ? FormulaPartFunction.CONCAT_LISTS.xfl : FormulaPartFunction.CONCAT.xfl
                : null;
                break;
            case 'c': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? FormulaPartFunction.CONTAINS.xfl
                : null;
                break;
            case 'e': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? FormulaPartFunction.ENDS_WITH.xfl
                : null;
                break;
            case 'g': part = allowedFunctions === FormulaFunctionGroup.glob
                ? FormulaPartFunction.GLOB.xfl
                : null;
                break;
            case 'i': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? altKey ? FormulaPartFunction.TYPE_OF.xfl : FormulaPartFunction.INDEX_OF.xfl
                : null;
                break;
            case 'l': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? altKey ? FormulaPartFunction.LOWERCASE.xfl : FormulaPartFunction.LENGTH.xfl
                : null;
                break;
            case 'm': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? FormulaPartFunction.MATCH.xfl
                : null;
                break;
            case 'n': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? allowAssign ? FormulaPartFunction.NEW.xfl : null
                : null;
                break;
            case 'r': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? FormulaPartFunction.REPLACE_ALL.xfl
                : null;
                break;
            case 's': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? altKey ? FormulaPartFunction.SUBSTRING.xfl : FormulaPartFunction.STARTS_WITH.xfl
                : null;
                break;
            case 'u': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? FormulaPartFunction.UPPERCASE.xfl
                : null;
                break;
            case 'x': part = allowedFunctions === FormulaFunctionGroup.allButGlob
                ? altKey ? FormulaPartFunction.AS_XFL.xfl : FormulaPartFunction.XPATH.xfl
                : null;
                break;
        }
        if (part) {
            formulaPart = new FormulaPartFunction(part, predecessor, apiService, documentRTC);
            formulaPart.root = root;
        }
        return formulaPart;
    }
}
