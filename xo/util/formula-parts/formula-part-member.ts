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
import { ApiService, RuntimeContext, XoStructureArray, XoStructureMethod, XoStructureObject } from '@zeta/api';

import { BehaviorSubject, Observable } from 'rxjs/';
import { filter, map, mergeMap } from 'rxjs/operators';

import { XoData } from '../../data.model';
import { XoRuntimeContext } from '../../runtime-context.model';
import { XoVariable } from '../../variable.model';
import { FormulaPart, ParsePartResult, StructuredPart } from './formula-part';


enum MemberType {
    memberVariable,
    memberFunction,
    tbd
}


export class FormulaPartMember extends FormulaPart implements StructuredPart {
    /**
     * The member is backed as an XoVariable (which, for a function, is the return type)
     */
    protected _memberSubject = new BehaviorSubject<XoVariable>(null);
    private readonly _type = new BehaviorSubject<MemberType>(MemberType.tbd);
    private readonly _allowVoidFunctions: boolean;
    private readonly _allowAsterisk: boolean;
    private readonly placeholder = new XoVariable();


    constructor(part: string, memberName: string, memberType: MemberType, predecessor: FormulaPart, allowVoidFunctions: boolean, allowAsterisk: boolean, apiService: ApiService, documentRTC: RuntimeContext) {
        super(part, predecessor, apiService, documentRTC);

        /** set placeholder so there's something to be rendered */
        this.placeholder.label = memberName;
        this.placeholder.isAbstract = true;

        this._type.next(memberType);
        this.memberName = memberName;
        this._allowVoidFunctions = allowVoidFunctions;
        this._allowAsterisk = allowAsterisk;
    }

    isMember(): boolean {
        return true;
    }

    isMemberVariable(): boolean {
        return this._type.value === MemberType.tbd
            ? undefined
            : this._type.value === MemberType.memberVariable;
    }

    isMemberVariable$(): Observable<boolean> {
        return this._type.pipe(filter(t => t !== MemberType.tbd), map(() => this.isMemberVariable()));
    }

    isMemberFunction(): boolean {
        return this._type.value === MemberType.tbd
            ? undefined
            : this._type.value === MemberType.memberFunction;
    }

    isMemberFunction$(): Observable<boolean> {
        return this._type.pipe(filter(t => t !== MemberType.tbd), map(() => this.isMemberFunction()));
    }

    allowVoidFunctions(): boolean {
        return this._allowVoidFunctions;
    }

    allowAsterisk(): boolean {
        return this._allowAsterisk;
    }

    get variable(): XoVariable {
        return this._memberSubject.value ?? this.placeholder;
    }

    get text(): string {
        return this.memberName;
    }

    get memberChange(): Observable<XoVariable> {
        return this._memberSubject.asObservable();
    }

    get memberName(): string {
        return this.part.substring(1);  // omit the '.'
    }

    /**
     * Set name of this member
     *
     * @param value Member name (without the preceding '.').
     * For a member variable, it's just the name of this variable.
     * For a member function, it's the name of this function with succeeding round brackets **()**
     */
    set memberName(value: string) {
        // for the part, add a '.' at the beginning and remove round brackets at the end (for member functions)
        this.setPart(value ? '.' + value.replace(/\(\)/, '') : '');

        // check if member is part of preceding structured part and retrieve variable model for member
        const structuredPart = this.precedingStructuredPart;
        if (structuredPart) {
            structuredPart.getStructure().subscribe(structureObject => {
                const member = this.variable || XoData.abstractData();
                let field = structureObject ? structureObject.children.find(child => child.name === value) : undefined;
                if (field) {
                    // is member of parent part
                    member.isAbstract = false;
                    member.label = field.label;
                    member.isList = field instanceof XoStructureArray;

                    // if field is a method, use return type
                    if (field instanceof XoStructureMethod) {
                        this._type.next(MemberType.memberFunction);
                        field = field.returns.length > 0 ? field.returns[0] : field;
                    } else {
                        this._type.next(MemberType.memberVariable);
                    }

                    // retrieve complex type or primitive type info from field
                    if (field.typeFqn) {
                        member.$fqn = field.typeFqn.path ? field.typeFqn.encode() : field.typeFqn.name;
                    }
                    if (field.typeRtc) {
                        member.$rtc = XoRuntimeContext.fromRuntimeContext(field.typeRtc);
                    }
                    member.parent = this.precedingStructuredPart?.variable;
                } else {
                    // not a member of parent part
                    member.isAbstract = true;
                    member.label = this.memberName;

                    // if type is not determined yet, assume abstract variable
                    if (this.editMode) {
                        this._type.next(MemberType.memberVariable);
                    }
                }
                this._memberSubject.next(member);
            });
        }
    }

    getStructure(): Observable<XoStructureObject> {
        return this.memberChange.pipe(
            filter(member => !!member),
            mergeMap(member => {
                if (!member.$fqn) {
                    // PMON-175
                    console.log(`No FQN set for formula member ${member.label} with ID ${member.id}. Cannot retrieve structure! This is probably no problem with the data and might be repeated automatically as soon as the data has been completed.`);
                }
                return FormulaPart.getStructure(member.$fqn, this.apiService, this.documentRTC, member.root);
            })
        );
    }

    hasMembers(): Observable<boolean> {
        return this.getStructure().pipe(
            map(structure => structure.children.length > 0)
        );
    }

    get editMode(): boolean {
        return this._type.value === MemberType.tbd;
    }

    /**
     * Tries to parse this type of FormulaPart from the start of an expression, if matching
     * @param expression Expression to parse part from
     * @param predecessor Potential owner for this member (if there is one directly before this part)
     * @returns Created FormulaPart instance (if one could be parsed) and new expression without parsed part
     */
    static parsePart(expression: string, predecessor: FormulaPart, allowVoidFunctions: boolean, allowAsterisk: boolean, apiService: ApiService, documentRTC: RuntimeContext): ParsePartResult {
        // read member variable from part
        // exclude members followed by "(", which would be a member function call
        let matches = /^\.([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\()/.exec(expression);
        if (matches && matches.length > 1) {
            return {
                part: new FormulaPartMember(matches[0], matches[1], MemberType.memberVariable, predecessor, allowVoidFunctions, allowAsterisk, apiService, documentRTC),
                parsedExpression: expression.substr(matches[0].length)
            };
        }

        // if not, read member function from part
        // starting with "."
        matches = /^(\.([a-zA-Z_][a-zA-Z0-9_]*))\(/.exec(expression);
        if (matches && matches.length > 2) {
            return {
                part: new FormulaPartMember(matches[1], matches[2] + '()', MemberType.memberFunction, predecessor, allowVoidFunctions, allowAsterisk, apiService, documentRTC),
                parsedExpression: expression.substr(matches[1].length)  // leave last character "(" in expression
            };
        }

        return null;
    }

    static editableMember(allowVoidFunctions: boolean, allowAsterisk: boolean, apiService: ApiService, documentRTC: RuntimeContext): FormulaPartMember {
        const member = new FormulaPartMember('.', '', MemberType.tbd, null, allowVoidFunctions, allowAsterisk, apiService, documentRTC);
        return member;
    }
}
