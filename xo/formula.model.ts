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
import { ApiService, RuntimeContext, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoItem } from './item.model';
import { XoReferableObject } from './referable-object.model';
import { FormulaPart, ParsePartResult } from './util/formula-parts/formula-part';
import { FormulaFunctionGroup, FormulaPartFunction } from './util/formula-parts/formula-part-function';
import { FormulaPartLiteral } from './util/formula-parts/formula-part-literal';
import { FormulaPartMember } from './util/formula-parts/formula-part-member';
import { FormulaPartOperation } from './util/formula-parts/formula-part-operation';
import { FormulaPartSpecial } from './util/formula-parts/formula-part-special';
import { FormulaPartVariable } from './util/formula-parts/formula-part-variable';
import { XoVariable, XoVariableArray } from './variable.model';


export interface TextItem {
    getText(): string;      // text to display
    getValue(): string;     // source text
    getTemplateValue(): string; // source text when in template
}



@XoObjectClass(XoItem, 'xmcp.processmodeller.datatypes', 'Formula')
export class XoFormula extends XoItem implements TextItem {

    private _parts: Array<FormulaPart> = [];
    private _visibleParts: Array<FormulaPart> = []; // assumed to be a continuous area, marked by ¿...?
    private _partBeforeVisiblePart: FormulaPart;    // final part before visible parts begin
    private _partAfterVisiblePart: FormulaPart;    // first part after visible parts end

    @XoProperty()
    expression = '';

    /** If set manually, mergeVariables has to be called afterwards */
    // tslint:disable-next-line
    @XoProperty(XoVariableArray)
    input = new XoVariableArray<XoVariable>();

    /** If set manually, mergeVariables has to be called afterwards */
    @XoProperty(XoVariableArray)
    // tslint:disable-next-line
    output = new XoVariableArray<XoVariable>();

    @XoProperty()
    isVariablesReadonly = false;        // if set, variables-array must not be changed by the frontend

    private _isQuestionmarkHidden = false;
    private readonly _variables = new XoVariableArray<XoVariable>();

    /**
     * Allow assignment operators inside this formula
     */
    @XoProperty()
    @XoTransient()
    allowAssign = true;

    /**
     * Allow compare operators inside this formula
     */
    @XoProperty()
    @XoTransient()
    allowCompare = true;

    /**
     * Allow compare operators inside this formula
     */
    @XoProperty()
    @XoTransient()
    allowedFunctions: FormulaFunctionGroup = FormulaFunctionGroup.allButGlob;

    /**
     * Allow functions returning void inside this formula
     */
    @XoProperty()
    @XoTransient()
    allowVoidFunctions = true;

    /**
     * Allow asterisk instead of a distinct member
     */
    @XoProperty()
    @XoTransient()
    allowAsterisk = false;


    afterDecode() {
        super.afterDecode();
        this.mergeVariables();
    }


    mergeVariables() {
        this._variables.data.push(...this.input, ...this.output);
    }


    getVariables(): XoReferableObject[] {
        return [...super.getVariables(), ...this.variables.data];
    }


    /**
     * Parses formula expression into parts
     */
    parseExpression(apiService: ApiService, documentRTC: RuntimeContext) {
        this._parts = [];
        this._visibleParts = [];

        // unpack expression if it's braced
        if (this.expression.startsWith('{') && this.expression.endsWith('}')) {
            this.expression = this.expression.substr(1, this.expression.length - 2);
        }

        let expression = this.expression;
        let counter = 10000;                 // prevent endless loop
        let predecessor: FormulaPart = null;
        while (expression && expression.length > 0 && (--counter) > 0) {
            let partResult: ParsePartResult;
            if (
                (partResult = FormulaPartVariable.parsePart(expression, this.variables ? this.variables.data : [], predecessor, apiService, documentRTC)) ||
                (partResult = FormulaPartMember.parsePart(expression, predecessor, this.allowVoidFunctions, this.allowAsterisk, apiService, documentRTC)) ||
                (partResult = FormulaPartFunction.parsePart(expression, predecessor, apiService, documentRTC)) ||
                (partResult = FormulaPartOperation.parsePart(expression, predecessor, apiService, documentRTC)) ||
                (partResult = FormulaPartSpecial.parsePart(expression, predecessor, apiService, documentRTC)) ||
                (partResult = FormulaPartLiteral.parsePart(expression, predecessor, apiService, documentRTC))
            ) {
                this.addPart(partResult.part);
                expression = partResult.parsedExpression;
                predecessor = partResult.part;
            } else {
                // invalid formula, remove first character
                if (expression.charAt(0) !== ' ') { // no warning for whitespace
                    console.log('WARNING: Invalid formula, removing next character of: ' + expression);
                }
                expression = expression.substring(1);
            }
        }
        if (expression && expression.length) {
            console.warn(`Aborting to parse formula ${this.expression}.\nParser might got stuck in an endless loop!`);
        }
        this.evaluateVisibleParts();
    }


    protected updateExpression() {
        this.expression = this.parts.map(element => element.part).join('');
        this.evaluateVisibleParts();
    }


    protected evaluateVisibleParts() {
        // evaluate visible parts (marked by ¿?)
        this._partBeforeVisiblePart = null;
        this._partAfterVisiblePart = null;
        if (this.hasDoubleQuestionmark()) {
            let enteredVisibleArea = false;
            this._visibleParts = this.parts.filter(part => {
                let visible = false;
                if (part.text === '?') {
                    enteredVisibleArea = false;
                    this._partAfterVisiblePart = part;
                }
                if (enteredVisibleArea) {
                    visible = true;
                }
                if (part.text === '¿') {
                    enteredVisibleArea = true;
                    this._partBeforeVisiblePart = part;
                }
                return visible;
            });
        } else if (this.hasQuestionmark() && this.isQuestionmarkHidden) {
            this._visibleParts = this.parts.filter(part => {
                if (part.text === '?') {
                    this._partAfterVisiblePart = part;
                    return false;
                }
                return true;
            });
        } else {
            this._visibleParts = this.parts;
        }
    }


    get variables(): XoVariableArray<XoVariable> {
        return this._variables;
    }


    get parts(): Array<FormulaPart> {
        return this._parts;
    }


    get visibleParts(): FormulaPart[] {
        return this._visibleParts;
    }


    get partBeforeVisiblePart(): FormulaPart {
        return this._partBeforeVisiblePart;
    }


    get partAfterVisiblePart(): FormulaPart {
        return this._partAfterVisiblePart;
    }


    get lastVisiblePart(): FormulaPart {
        return this.visibleParts.length > 0 ? this.visibleParts[this.visibleParts.length - 1] : null;
    }


    /**
     * Adds a part to the formula
     * @param part Part to add
     * @param precedingToPart Add preceding to this part (if null, adds at the end)
     * @param respectVisibleArea If precedingToPart is not set, this flag decides if part is added at the end of the formula or only at the end of the visible area (surrounded by ¿?)
     */
    addPart(part: FormulaPart, precedingToPart?: FormulaPart, respectVisibleArea?: boolean) {
        let index = this.parts.findIndex(element => element === precedingToPart);
        if (respectVisibleArea && index < 0) {      // add at the end of the visible area
            index = this.parts.findIndex(p => this.partAfterVisiblePart === p);
        }
        this.addPartAtIndex(part, index);
    }


    addPartAtIndex(part: FormulaPart, index: number) {
        if (this.canAdd(part, index)) {
            const successor = (index >= 0 && index < this.parts.length) ? this.parts[index] : null;
            if (index < 0) {
                index = this.parts.length;
            }
            if (index >= 0) {
                const predecessor = index > 0 ? this.parts[index - 1] : null;

                if (part.predecessor !== predecessor) {
                    part.predecessor = predecessor;
                }

                // try to merge with predecessor
                if (!(predecessor && predecessor.merge(part))) {
                    // ... or insert as new part
                    this.parts.splice(index, 0, part);
                    if (successor) {
                        successor.predecessor = part;
                    }
                }
            }

            // subscribe to changes
            part.changed().subscribe(formulaPart => this.updateExpression());

            // rebuild expression string with added part included
            this.updateExpression();
        }
    }


    /**
     * Removes part from expression.
     * @param part Part to remove
     */
    removePart(part: FormulaPart) {
        // remove part from expression and fix connections
        this._parts = this.parts.filter(element => {
            if (element.predecessor === part) {
                element.predecessor = part.predecessor;
            }
            return element !== part;
        });
        this.updateExpression();
    }


    getVisiblePrecedingPart(toPart: FormulaPart): FormulaPart {
        return this.visibleParts.find(visiblePart => visiblePart === toPart.predecessor) || null;
    }


    getVisibleSucceedingPart(toPart: FormulaPart): FormulaPart {
        return this.visibleParts.find(visiblePart => !!toPart && visiblePart.predecessor === toPart) || null;
    }


    protected canAdd(part: FormulaPart, index: number): boolean {
        // only one questionmark is allowed inside a formula
        return !(part.text === '?' && this.hasQuestionmark());
    }


    private hasQuestionmark(): boolean {
        // remark: parts have to be checked instead of the expression, because when parsing the first time,
        // the expression contains the ? and the parts don't. In this case, adding shall be allowed (PMOD-623)
        return !!this.parts.find(part => part.text === '?');
    }


    hasDoubleQuestionmark(): boolean {
        return this.expression.indexOf('¿') >= 0 && this.expression.indexOf('?') >= 0;
    }


    get isQuestionmarkHidden(): boolean {
        return this._isQuestionmarkHidden;
    }


    set isQuestionmarkHidden(value: boolean) {
        if (value !== this._isQuestionmarkHidden) {
            this._isQuestionmarkHidden = value;
            this.evaluateVisibleParts();
        }
    }


    getText(): string {
        return this.expression;
    }


    getValue(): string {
        return this.expression;
    }


    getTemplateValue(): string {
        const value = this.getValue();

        // if brackets are not valid, put formula into {}-brackets, if not already
        const bracketStack = [];
        for (const v of value) {
            const lastBracket = bracketStack.length > 0 ? bracketStack[bracketStack.length - 1] : null;
            if (v === '(' || v === '[' || v === '{') {
                bracketStack.push(v);
            } else if (lastBracket && (
                v === ')' && lastBracket === '(' ||
                v === ']' && lastBracket === '[' ||
                v === '}' && lastBracket === '{')
            ) {
                bracketStack.pop();
            }
        }
        return value.startsWith('{') || bracketStack.length === 0 ? value : `{${value}}`;
    }


    static emptyFormula(): XoFormula {
        const formula = new XoFormula();
        formula.expression = '';
        return formula;
    }
}
