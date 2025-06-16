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
import { Component, ElementRef, HostBinding, HostListener, Injector, Input, Optional, QueryList, ViewChild, ViewChildren } from '@angular/core';

import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { ApiService } from '@zeta/api';
import { coerceBoolean } from '@zeta/base';

import { filter } from 'rxjs/operators';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeFormulaRequest } from '../../../xo/change-formula-request.model';
import { XoData } from '../../../xo/data.model';
import { XoException } from '../../../xo/exception.model';
import { XoFormula } from '../../../xo/formula.model';
import { XoInsertFormulaVariableRequest } from '../../../xo/insert-formula-variable-request.model';
import { FormulaPart } from '../../../xo/util/formula-parts/formula-part';
import { FormulaPartFunction } from '../../../xo/util/formula-parts/formula-part-function';
import { FormulaPartLiteral } from '../../../xo/util/formula-parts/formula-part-literal';
import { FormulaPartMember } from '../../../xo/util/formula-parts/formula-part-member';
import { FormulaPartOperation } from '../../../xo/util/formula-parts/formula-part-operation';
import { FormulaPartSpecial } from '../../../xo/util/formula-parts/formula-part-special';
import { FormulaPartVariable } from '../../../xo/util/formula-parts/formula-part-variable';
import { XoVariable } from '../../../xo/variable.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModDropEvent } from '../shared/drag-and-drop/mod-drop-area.directive';
import { ModellingItemComponent, TriggeredAction } from '../shared/modelling-object.component';
import { FormulaEditablePartComponent } from './parts/formula-editable-part.component';
import { FormulaChildComponent } from './parts/formula-part.component';


@Component({
    selector: 'formula',
    templateUrl: './formula.component.html',
    styleUrls: ['./formula.component.scss'],
    standalone: false
})
export class FormulaComponent extends ModellingItemComponent {

    @ViewChild('formulaWrapper', {static: false})
    formulaWrapper: ElementRef;

    private _partWithCaret: FormulaPart = null;     // caret is at the beginning of this part
    private _partInEditing: FormulaPart = null;     // if set, the focus is inside this part (e. g. while editing a literal)
    private _selected = false;                      // formula or a sub-element is selected
    private _cachedExpression = '';
    private _partWaitingForFocus: FormulaPart = null;
    private _editableParts = new QueryList<FormulaEditablePartComponent>();
    private _externalChildren = new QueryList<FormulaChildComponent>();     // elements with children outside of formula-DOM-hierarchy (such as dropdown-options)
    private _dropDisabled = false;
    private _variableMenuDisabled = false;          // no menu for formula variables

    proxyIndex = -1;                                // if >= 0, the proxy-dropdown with all the xfl-functions is shown

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        readonly detailLevelService: WorkflowDetailLevelService,
        private readonly apiService: ApiService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
    }


    /**
     * Call as soon as document model and formula have been set
     */
    protected initFormula() {
        if (this.formula && this.documentModel) {
            this.formula.parseExpression(this.apiService, this.documentModel.originRuntimeContext);
        }
    }


    allowItem = (xoFqn: string, xoId?: string): boolean => {
        const isAllowedType = (fqn: string): boolean =>
            fqn.toLowerCase() === XoData.fqn.encode().toLowerCase() ||
            fqn.toLowerCase() === XoException.fqn.encode().toLowerCase();

        // checks if variable is contained in formula's variable-list
        const isAllowedId = (id: string): boolean =>
            this.getVariableIndex(id) >= 0;

        return !this.readonly && !this.dropDisabled && (isAllowedType(xoFqn) && (!this.formula.isVariablesReadonly || isAllowedId(xoId)));
    };


    dropped(event: ModDropEvent) {
        if (!event.sameArea || event.sourceIndex !== event.index) {
            // there's no move operation inside the formula, so the container size always increases by 1
            const newContainerSize = this.formula.visibleParts.length + 1;
            const partIndex = event.index >= newContainerSize - 1 ? -1 : event.index;
            const variable = event.item as XoVariable;

            // add part into formula (check if variable already exists inside formula and reuse it)
            let insertAsNewVariable = false;
            const variableIndex = this.getVariableIndex(variable.id) ?? (insertAsNewVariable = true, this.formula.input.length);

            /** @todo use a factory function of FormulaPartVariable for this */
            const variablePart = new FormulaPartVariable('%' + variableIndex + '%', variable, null, this.apiService, this.documentModel.originRuntimeContext);
            const succeedingPart = partIndex < this.formula.visibleParts.length ? this.formula.visibleParts[partIndex] : this.formula.lastVisiblePart;
            this.formula.addPart(variablePart, succeedingPart, true);

            // perform change on formula (insert-variable as succeeding action, if an insert of variables is allowed for this formula)
            const changeExpressionAction: TriggeredAction = {
                type: ModellingActionType.change,
                objectId: this.formula.id,
                request: new XoChangeFormulaRequest(undefined, this.formula.expression)
            };

            if (!insertAsNewVariable) {
                this.performAction(changeExpressionAction);
            } else {
                if (variable.castToFqn) {
                    variable.$fqn = variable.castToFqn;
                }
                // perform two subsequent requests (insert variable, change expression)
                this.performAction({
                    request: new XoInsertFormulaVariableRequest('', -1, variable),       // always add at the end of variable list
                    objectId: this.formula.id,
                    type: ModellingActionType.insert,
                    subsequentAction: changeExpressionAction
                });
            }
        }
    }


    /**
     * Returns index or undefined
     */
    private getVariableIndex(id: string): number {
        const index = this.formula.variables.data.findIndex(entry => entry.id === id);
        return index >= 0 ? index : undefined;
    }


    @Input()
    set formula(value: XoFormula) {
        this.setModel(value);
        this.initFormula();
    }


    get formula(): XoFormula {
        return this.getModel() as XoFormula;
    }


    protected afterDocumentModelSet() {
        super.afterDocumentModelSet();
        this.initFormula();
    }


    @Input()
    set hideQuestionmark(value: boolean) {
        this.formula.isQuestionmarkHidden = coerceBoolean(value);
    }


    get hideQuestionmark(): boolean {
        return this.formula.isQuestionmarkHidden;
    }


    @Input('drop-disabled')
    set dropDisabled(value: boolean) {
        this._dropDisabled = coerceBoolean(value);
    }


    get dropDisabled(): boolean {
        return this._dropDisabled;
    }


    @Input('variable-menu-disabled')
    set variableMenuDisabled(value: boolean) {
        this._variableMenuDisabled = coerceBoolean(value);
    }


    get variableMenuDisabled(): boolean {
        return this._variableMenuDisabled;
    }


    @HostBinding('class.editable')
    get editable(): boolean {
        return !this.readonly;
    }


    get partWithCaret(): FormulaPart {
        return this._partWithCaret;
    }


    setCaretToPart(part: FormulaPart) {
        if (part === null || this.formula.visibleParts.indexOf(part) >= 0) {
            // only if this part is visible or null
            this._partWithCaret = part;
        }
    }


    get showCaret(): boolean {
        return this.selected && !this._partInEditing && this.proxyIndex < 0;
    }


    removePart(part: FormulaPart) {
        // only remove, if part is visible
        if (this.formula.visibleParts.indexOf(part) >= 0) {
            // set caret at succeeding part, if part with caret shall be removed
            if (part === this.partWithCaret) {
                this.setCaretToPart(this.formula.getVisibleSucceedingPart(part));
            }
            this.formula.removePart(part);
        }
    }


    @HostBinding('class.selected')
    get selected(): boolean {
        return this._selected;
    }


    select() {
        this._selected = true;
        this._cachedExpression = this.formula.expression;
    }


    unselect() {
        if (this.selected) {
            this._selected = false;
            this.setCaretToPart(null);
            this._partInEditing = null;
            this._partWaitingForFocus = null;

            // trigger a change for the expression, if changed
            if (this._cachedExpression !== this.formula.expression) {
                this.performAction({
                    type: ModellingActionType.change,
                    objectId: this.formula.id,
                    request: new XoChangeFormulaRequest(undefined, this.formula.expression)
                });
            }
        }
    }


    moveCaretForward() {
        this.setCaretToPart(this.formula.getVisibleSucceedingPart(this.partWithCaret));
    }


    moveCaretBackward() {
        if (this.partWithCaret) {
            const predecessor = this.formula.getVisiblePrecedingPart(this.partWithCaret);
            if (predecessor) {
                this.setCaretToPart(predecessor);
            }
        } else {
            // set caret to last part
            this.setCaretToPart(this.formula.lastVisiblePart);
        }
    }


    // -----------------------------------------------------------------------------
    // Sub-Parts
    // -----------------------------------------------------------------------------

    startedEditingSubPart(part: FormulaPart) {
        // catch up on selecting the formula, if the sub-part was selected before selecting the formula
        if (!this.selected) {
            this.select();
            this.setCaretToPart(part);
        }
        this._partInEditing = part;
    }


    acceptedEditingSubPart(part: FormulaPart) {
        const nextPartForCaret = this.formula.getVisibleSucceedingPart(part);

        /** @todo This should pe placed inside FormulaPartMemberComponent, somehow */
        part.isMemberFunction$().pipe(filter(result => result)).subscribe(() => {
            const successor = this.formula.getVisibleSucceedingPart(part);
            this.formula.addPart(new FormulaPartSpecial('(', null, this.apiService, this.documentModel.originRuntimeContext), successor, true);
            this.formula.addPart(new FormulaPartSpecial(')', null, this.apiService, this.documentModel.originRuntimeContext), successor, true);
        });

        this._partInEditing = null;
        this.setCaretToPart(nextPartForCaret);
    }


    finishedEditingSubPart(_: FormulaPart) {
        this.formulaWrapper?.nativeElement.focus();       // refocus formula-area

        // if it hasn't been accepted before, leave formula
        if (this._partInEditing) {
            this.unselect();
        }
    }


    // -----------------------------------------------------------------------------
    // Event Handling
    // -----------------------------------------------------------------------------

    clickOnPart(part: FormulaPart) {
        if (this.readonly) {
            return;
        }
        if (!this.selected) {
            this.select();      // initial click on a part selects the formula
        }
        this.setCaretToPart(part);
    }


    @HostListener('click')
    @HostListener('focus')
    clickOnFormula() {
        if (!this.readonly && !this.selected) {
            this.select();
            this.formulaWrapper.nativeElement.focus();   // focus formula-area instead of formula
        }
    }


    @HostListener('focusout', ['$event.relatedTarget'])
    blur(relatedTarget: Element) {
        // check if a sub-element of this formula has been focused instead and stay in selected mode
        if (this.formulaWrapper.nativeElement !== relatedTarget &&
            !this.formulaWrapper.nativeElement.contains(relatedTarget) &&
            !this._externalChildren?.find(child => !!child.getChildren().find(externalChild => externalChild === relatedTarget))
        ) {
            this.unselect();
        }
    }


    @HostListener('keydown', ['$event'])
    keydown(event: KeyboardEvent) {
        // if proxy menu is open, these shortcuts shall not take effect
        if (this.readonly || this.proxyIndex >= 0) {
            return;
        }

        const predecessor = this.partWithCaret
            ? this.formula.getVisiblePrecedingPart(this.partWithCaret)
            : this.formula.lastVisiblePart;

        if (event.key === 'ArrowLeft') {
            this.moveCaretBackward();
            event.preventDefault();                 // prevent scrolling via arrows
        } else if (event.key === 'ArrowRight') {
            this.moveCaretForward();
            event.preventDefault();                 // prevent scrolling via arrows
        } else if (event.key === 'Home') {
            if (this.formula.visibleParts.length > 0) {
                this.setCaretToPart(this.formula.visibleParts[0]);
            }
        } else if (event.key === 'End') {
            this.setCaretToPart(null);
        } else if (event.key === 'Delete') {
            // delete part right to caret
            if (this.partWithCaret) {
                this.removePart(this.partWithCaret);
            }
            event.stopPropagation();
        } else if (event.key === 'Backspace') {
            event.preventDefault();
            if (this.partWithCaret) {
                // delete part left to caret
                if (predecessor) {
                    this.removePart(predecessor);
                }
            } else if (this.formula.lastVisiblePart) {
                // remove last part
                this.removePart(this.formula.lastVisiblePart);
            }
        } else if (event.key === 'Enter') {
            // with CTRL pressed, focus literal, if caret is in front of one
            if (event.ctrlKey && this.partWithCaret && this.partWithCaret.isLiteral()) {
                this.focusPart(this.partWithCaret);
            } else {
                // ... or finish editing
                this.formulaWrapper.nativeElement.blur();
            }
        } else {

            // -------------------------------------------------
            // shortcuts to create parts
            // -------------------------------------------------
            let part: FormulaPart = null;

            if (event.key === '"') {
                // insert literal part
                /** @todo use static factory function */
                const literalPart = new FormulaPartLiteral('""', '', null, this.apiService, this.documentModel.originRuntimeContext);
                this.formula.addPart(literalPart, this.partWithCaret, true);
                this._partWaitingForFocus = literalPart;
            } else if (event.key === '.' || event.ctrlKey && event.key === ' ') {
                const precedingStructure = this.partWithCaret           // if null, caret is at the end of visible parts
                    ? this.partWithCaret.precedingStructuredPart
                    : (this.formula.lastVisiblePart                     // use last visible part or, if empty, part before visible parts
                        ? this.formula.lastVisiblePart.structuredPart
                        : (this.formula.partBeforeVisiblePart ? this.formula.partBeforeVisiblePart.structuredPart : null)
                    );
                // if predecessor is a structured part, a member can be added
                if (precedingStructure) {
                    precedingStructure.hasMembers().subscribe(hasMembers => {
                        if (hasMembers) {
                            const memberPart = FormulaPartMember.editableMember(this.formula.allowVoidFunctions, this.formula.allowAsterisk, this.apiService, this.documentModel.originRuntimeContext);
                            this.formula.addPart(memberPart, this.partWithCaret, true);
                            this._partWaitingForFocus = memberPart;
                        }
                    });
                } else if (event.ctrlKey && event.key === ' ') {
                    this.proxyIndex = this.partWithCaret ? this.formula.visibleParts.indexOf(this.partWithCaret) : this.formula.visibleParts.length;
                }
            } else if ((part = FormulaPartSpecial.specialPartForKey(event.key, predecessor, this.apiService, this.documentModel.originRuntimeContext))) {
                this.formula.addPart(part, this.partWithCaret, true);
            } else if ((part = FormulaPartOperation.operationForKey(event.key, predecessor, this.apiService, this.documentModel.originRuntimeContext, this.formula.allowAssign, this.formula.allowCompare))) {
                this.formula.addPart(part, this.partWithCaret, true);
            } else if ((part = FormulaPartFunction.functionForKey(event.key, predecessor, this.apiService, this.documentModel.originRuntimeContext, event.altKey, this.formula.allowAssign, this.formula.allowedFunctions, this.formula))) {
                this.formula.addPart(part, this.partWithCaret, true);
            }
        }

        event.stopPropagation();
    }


    protected focusPart(formulaPart: FormulaPart) {
        const partComponent = this._editableParts.find(part => part.formulaPart === formulaPart);
        if (partComponent) {
            setTimeout(() => partComponent.setFocus());  /** @todo fixme: Find solution without timeout */
        }
    }


    protected finishProxy(value: string) {
        if (value) {
            // generate part out of proxy-selection
            const tmpFormula = new XoFormula();
            tmpFormula.expression = value;
            tmpFormula.parseExpression(this.apiService, this.documentModel.originRuntimeContext);

            tmpFormula.parts?.forEach((part: FormulaPart, index: number) =>
                this.formula.addPartAtIndex(part, this.proxyIndex + index)
            );
        }

        // finish proxy-mode and refocus formula
        this.proxyIndex = -1;
        this.formulaWrapper.nativeElement.focus();
    }


    protected allowRemoveWithDeleteKey(): boolean {
        // don't delete whole formula when pressing delete while editing
        return false;
    }


    /**
     * Set focus to editable parts
     */
    @ViewChildren('editablePart')
    private set editableParts_setOnly(parts: QueryList<FormulaEditablePartComponent>) {
        this._editableParts = parts;

        // focus part if there is a waiting one
        if (this._partWaitingForFocus) {
            this.focusPart(this._partWaitingForFocus);
            this._partWaitingForFocus = null;
        }
    }


    /**
     * Gather children which are no children inside the DOM hierarchy
     */
    @ViewChildren('externalChild')
    private set externalChildren_setOnly(children: QueryList<FormulaChildComponent>) {
        this._externalChildren = children;
    }
}
