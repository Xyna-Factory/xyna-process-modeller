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
import { AfterContentInit, AfterViewInit, Component, ViewChild } from '@angular/core';

import { XoStructureField, XoStructureMethod, XoStructureObject } from '@zeta/api';
import { XcAutocompleteDataWrapper, XcFormAutocompleteComponent, XcOptionItem } from '@zeta/xc';

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { FormulaPartMember } from '../../../../../xo/util/formula-parts/formula-part-member';
import { FormulaEditablePartComponent } from '../formula-editable-part.component';
import { FormulaChildComponent } from '../formula-part.component';


@Component({
    selector: 'formula-part-member',
    templateUrl: './formula-part-member.component.html',
    styleUrls: ['./formula-part-member.component.scss']
})
export class FormulaPartMemberComponent extends FormulaEditablePartComponent implements AfterViewInit, AfterContentInit, FormulaChildComponent {

    @ViewChild(XcFormAutocompleteComponent, {static: false})
    private readonly _memberInput: XcFormAutocompleteComponent;

    private _optionElements: HTMLElement[] = [];

    memberDataWrapper = new XcAutocompleteDataWrapper(
        () => this.memberPart ? this.memberPart.memberName : null,
        (value: string) => {
            this.memberPart.memberName = value;
            this.acceptEditing();
        },
        []
    );


    ngAfterContentInit() {
        // set values for possible members
        this.possibleMembers.subscribe(
            options => {
                if (options.length > 0) {
                    this.memberDataWrapper.values = options;
                } else {
                    this.finishEditing(null);
                }
            }
        );
    }


    ngAfterViewInit() {
        this._memberInput?.setFocus();
    }


    opened() {
        this._optionElements = this._memberInput?.trigger?.autocomplete?.options?.map(option => option._getHostElement());
    }


    closed() {
        this._optionElements = [];

        /** @todo fixme The autocomplete seems to be buggy. If the focus is inside the ac and the user clicks somewhere else, this function is called.
         * "finishEditing" then causes a reload of the workflow. The workflow model gets updated, though, but the view does not update.
         * As soon as the user clicks on a view element, the workflow-view gets updated, too.
         * Seems as if the ac-component prevents an update of the view for one cycle
         */
        this.finishEditing(null);
    }


    setFocus() {
        if (this._memberInput) {
            this._memberInput.setFocus();
        }
    }


    get editing(): boolean {
        return this.memberPart && this.memberPart.editMode;
    }


    get memberPart(): FormulaPartMember {
        return this.formulaPart as FormulaPartMember;
    }


    get possibleMembers(): Observable<XcOptionItem[]> {
        const validMember = (field: XoStructureField): boolean =>
            // all members are valid except for member functions with not-one return type
            !(field instanceof XoStructureMethod) ||
            (field.returns.length === 1) ||
            (this.memberPart.allowVoidFunctions() && field.returns.length === 0);

        const precedingStructuredPart = this.memberPart.precedingStructuredPart;
        if (precedingStructuredPart) {
            return precedingStructuredPart.getStructure().pipe(
                map((structure: XoStructureObject) => {
                    const members = structure?.children.filter(validMember).map(field =>
                        <XcOptionItem>{ name: field.toString(), value: field.name }
                    ) ?? [];
                    if (this.memberPart.allowAsterisk()) {
                        members.push(<XcOptionItem>{ name: '*', value: '*' });
                    }
                    return members;
                })
            );
        }
        return of([]);
    }


    getChildren(): HTMLElement[] {
        return this._optionElements;
    }
}
