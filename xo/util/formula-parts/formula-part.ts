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
import { ApiService, FullQualifiedName, RuntimeContext, XoDescriberCache, XoStructureObject } from '@zeta/api';

import { Observable, of, Subject } from 'rxjs';

import { isOrderable, Orderable } from '../../../api/xmom-types';
import { XoReferableObject } from '../../referable-object.model';
import { XoVariable } from '../../variable.model';


export interface StructuredPart {
    getStructure(): Observable<XoStructureObject>;
}



export class FormulaPart {
    private _part: string;
    private _predecessor: FormulaPart = null;
    private readonly _apiService: ApiService;
    private readonly _documentRTC: RuntimeContext;

    protected changeSubject = new Subject<FormulaPart>();

    static structureCache = new XoDescriberCache<XoStructureObject>(100);

    constructor(part: string, predecessor: FormulaPart, apiService: ApiService, documentRTC: RuntimeContext) {
        this.setPart(part);
        this.predecessor = predecessor;
        this._apiService = apiService;
        this._documentRTC = documentRTC;
    }

    isVariable(): boolean {
        return false;
    }

    isMember(): boolean {
        return false;
    }

    /**
     * May return _undefined_ if result is not certain, yet
     */
    isMemberVariable(): boolean {
        return false;
    }

    /**
     * Observable first triggers if member has decided to be either variable or function
     */
    isMemberVariable$(): Observable<boolean> {
        return of(false);
    }

    /**
     * May return _undefined_ if result is not certain, yet
     */
    isMemberFunction(): boolean {
        return false;
    }

    /**
     * Observable first triggers if member has decided to be either variable or function
     */
    isMemberFunction$(): Observable<boolean> {
        return of(false);
    }

    isFunction(): boolean {
        return false;
    }

    isFunctionReturningVariable(): boolean {
        return false;
    }

    isOperation(): boolean {
        return false;
    }

    isSpecial(): boolean {
        return false;
    }

    isLiteral(): boolean {
        return false;
    }

    isProxy(): boolean {
        return false;
    }

    hasMembers(): Observable<boolean> {
        return of(false);
    }

    get part(): string {
        return this._part;
    }

    protected setPart(value: string) {
        if (this.part !== value) {
            this._part = value;
            this.changeSubject.next(this);
        }
    }

    /**
     * Merges given part into this one
     * @param successor Part to merge
     * @returns merge is **true**, if part was merged, **false** otherwise
     */
    merge(successor: FormulaPart): boolean {
        return false;
    }

    get text(): string {
        return this._part;
    }

    get variable(): XoVariable {
        return null;
    }

    /**
     * Retrieves part that is the nearest structured part to this part (even itself).
     * @returns Structured part, if there is one. **null** otherwise
     */
    get structuredPart(): (FormulaPart & StructuredPart) {
        const bracketsValid = (e: string): boolean => {
            /**
             * Brackets [*] and (*) in valid order are allowed between this part and its parent variable
             *
             * allowed: [*] and (*)
             * allowed: [*](*) and (*)[*]
             * disallowed: (*)(*) and [*][*]
             */
            const NOT_STARTED = 0, INSIDE = 1, ENDED = 2;
            let squareBracketStack = 0, roundBracketStack = 0;
            let squareBracketStatus = NOT_STARTED, roundBracketStatus = NOT_STARTED;
            for (let i = 0; i < e.length; i++) {
                const char = e.charAt(i);
                switch (char) {
                    case '[': squareBracketStack++; break;
                    case ']': squareBracketStack--; break;
                    case '(': roundBracketStack++; break;
                    case ')': roundBracketStack--; break;
                }

                if (squareBracketStack > 0 && squareBracketStatus !== ENDED) {
                    squareBracketStatus = INSIDE;
                } else if (squareBracketStack === 0 && squareBracketStatus === INSIDE) {
                    squareBracketStatus = ENDED;
                } else if (squareBracketStack > 0 && squareBracketStatus === ENDED || squareBracketStack < 0) {
                    return false;
                }
                if (roundBracketStack > 0 && roundBracketStatus !== ENDED) {
                    roundBracketStatus = INSIDE;
                } else if (roundBracketStack === 0 && roundBracketStatus === INSIDE) {
                    roundBracketStatus = ENDED;
                } else if (roundBracketStack > 0 && roundBracketStatus === ENDED || roundBracketStack < 0) {
                    return false;
                }
            }

            return true;
        };

        // build expression up to potential parent-variable-part
        let expression = '';
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let parent: FormulaPart = this;  // actually starting with this part itself
        while (parent && !((parent.isVariable() || parent.isMemberVariable() || parent.isMemberFunction() || parent.isFunctionReturningVariable()) && bracketsValid(expression))) {
            expression = parent.part + expression;
            parent = parent.predecessor;
        }

        return bracketsValid(expression) ? <FormulaPart & StructuredPart>parent : null;
    }

    /* PMOD-882 TODO
    1. get structurePart() also has to return #cast() and new() as StructurePart
    1.1. for this, parent.isVariableReturningFunction has to be added (true for FormulaPartFunction #cast and new)
    2. FormulaPartFunction "#cast" and "new" (while they are StructureParts, now) have to retrieve a structure depending on the FQN-parameter inside their brackets
    */

    /**
     * Retrieves nearest structured part, while the search begins at the predecessor of this part.
     * Thus, if this part is a structured part itself, it doesn't return this but a preceding structured part.
     *
     * @inheritdoc
     */
    get precedingStructuredPart(): (FormulaPart & StructuredPart) {
        return this.predecessor ? this.predecessor.structuredPart : null;
    }

    get predecessor(): FormulaPart {
        return this._predecessor;
    }

    set predecessor(value: FormulaPart) {
        this._predecessor = value;
    }

    changed(): Observable<FormulaPart> {
        return this.changeSubject.asObservable();
    }

    protected get apiService(): ApiService {
        return this._apiService;
    }

    protected get documentRTC(): RuntimeContext {
        return this._documentRTC;
    }

    /**
     * @param root Root container implementing or not the interface Orderable to request an orderId-sensitive structure
     */
    protected static getStructure(fqn: string, apiService: ApiService, rtc: RuntimeContext, root?: XoReferableObject): Observable<XoStructureObject> {
        // FIXME: FQN is sometimes undefined here, see PMOD-1027
        if (fqn && fqn.indexOf('.') >= 0) {
            // not primitive or abstract
            const describer = {fqn: FullQualifiedName.decode(fqn)};

            // in case of an Audit, fetch structure for distinct Order-ID
            const orderId = isOrderable(root) ? (<unknown>root as Orderable).orderId : undefined;
            const structure = apiService.getStructure(rtc, [describer], FormulaPart.structureCache, orderId);
            return structure.get(describer);
        }
        return of(XoStructureObject.empty());
    }
}



export interface ParsePartResult {
    part: FormulaPart;
    parsedExpression: string;
}
