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
import { Component, HostBinding, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { RuntimeContext, Xo } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcMenuItem } from '@zeta/xc';

import { XmomObjectType } from '../../../api/xmom-types';
import { ModellingActionType } from '../../../api/xmom.service';
import { LabelPathDialogComponent, LabelPathDialogData } from '../../../misc/modal/label-path-dialog/label-path-dialog.component';
import { XoChangeDynamicTypingRequest } from '../../../xo/change-dynamic-typing-request.model';
import { XoChangeLabelRequest } from '../../../xo/change-label-request.model';
import { XoChangeMultiplicityRequest } from '../../../xo/change-multiplicity-request.model';
import { ConversionTarget } from '../../../xo/convert-request.model';
import { XoConvertVariableRequest } from '../../../xo/convert-variable-request.model';
import { XoData } from '../../../xo/data.model';
import { XoException } from '../../../xo/exception.model';
import { XoFormula } from '../../../xo/formula.model';
import { XoMapping } from '../../../xo/mapping.model';
import { XoModellingItem } from '../../../xo/modelling-item.model';
import { XoReferableObject } from '../../../xo/referable-object.model';
import { XoSetConstantRequest } from '../../../xo/set-constant-request.model';
import { XoVariable } from '../../../xo/variable.model';
import { DocumentService } from '../../document.service';
import { CONSTANT_DIALOG_DELETE_TOKEN, ConstantDialogComponent, ConstantDialogData } from '../../modal/constant-dialog/constant-dialog.component';
import { SelectionService } from '../../selection.service';
import { BranchSelectionService } from '../distinction/branch/branch-selection.service';
import { ModDropEvent } from '../shared/drag-and-drop/mod-drop-area.directive';
import { SelectableModellingObjectComponent } from '../shared/selectable-modelling-object.component';


@Component({
    selector: 'variable',
    templateUrl: './variable.component.html',
    styleUrls: ['./variable.component.scss'],
    standalone: false
})
export class VariableComponent extends SelectableModellingObjectComponent {

    protected readonly router = inject(Router);
    protected readonly documentService = inject(DocumentService);
    protected readonly detailLevelService = inject(WorkflowDetailLevelService);
    protected readonly selectionService = inject(SelectionService);
    protected readonly i18n = inject(I18nService);
    protected readonly dialogService = inject(XcDialogService);
    protected readonly branchSelection = inject(BranchSelectionService);

    @Input()
    hasMenu = true;

    @Input()
    @HostBinding('class.placeholder')
    isPlaceholder = false;

    showFqn = true;

    private readonly constantMenuItem: XcMenuItem;


    constructor() {
        super();

        // get constant from selected branch, if any
        const getConstant = (): Xo =>
            this.variable.getConstant(this.selectedBranch?.id);

        // if variable depends on branches, one of this branches has to be selected to assign a constant for it
        const viewConstant = (): boolean =>
            (
                // variable must allow constants
                this.variable.allowConst === 'ALWAYS' ||
                this.variable.allowConst === 'FOR_BRANCHES' && !!this.selectedBranch
            ) && (
                // document isn't locked, or a specific constant is already set
                !this.isLocked() || !!getConstant()
            );

        this.constantMenuItem = <XcMenuItem>{
            name: '',
            translate: true,
            visible: () => viewConstant(),
            click: () => {
                this.dialogService.custom(
                    ConstantDialogComponent,
                    <ConstantDialogData>{
                        rtc: this.getDocumentRtc(),
                        variable: this.variable,
                        constant: getConstant(),
                        readonly: this.isLocked()
                    }
                ).afterDismissResult().subscribe(result => {
                    // Because it is possible to set null as a constant there is a symbol to check if the constant should be deleted
                    if (result === CONSTANT_DIALOG_DELETE_TOKEN) {
                        this.performAction({
                            request: XoSetConstantRequest.withConstantObject(null, this.selectedBranch?.id),
                            type: ModellingActionType.deleteConstant,
                            objectId: this.variable.id
                        });
                    } else if (result instanceof Xo) {
                        this.performAction({
                            request: XoSetConstantRequest.withConstantObject(result, this.selectedBranch?.id),
                            type: ModellingActionType.setConstant,
                            objectId: this.variable.id
                        });
                    } else {
                        this.dialogService.info('Not supported', 'Setting \'null\' as a root level input is not yet supported.');
                    }
                });
            }
        };
        this.menuItems.unshift(
            <XcMenuItem>{
                name: 'Open in new Tab', translate: true,
                visible: () => !!this.variable.$fqn, // prototype variable does not have an fqn
                click: () => {
                    const fqn = this.variable.toFqn();
                    const rtc = (this.variable.$rtc ?? this.variable.evaluatedRtc).runtimeContext();
                    let type: XmomObjectType;
                    if (this.variable.type === XmomObjectType.ExceptionType) {
                        type = XmomObjectType.ExceptionType;
                    }
                    if (this.variable.type === XmomObjectType.DataType) {
                        type = XmomObjectType.DataType;
                    }
                    if (type) {
                        this.documentService.loadDocument(rtc, fqn, type);
                        void this.router.navigate(['xfm/Process-Modeller/']);
                    }
                }
            },
            this.constantMenuItem,
            <XcMenuItem>{
                name: 'Convert into List',
                translate: true,
                visible: () => !this.variable.isList && !this.readonly,
                click: () => this.toggleMultiplicity()
            },
            <XcMenuItem>{
                name: 'Convert into Single',
                translate: true,
                visible: () => this.variable.isList && !this.readonly,
                click: () => this.toggleMultiplicity()
            },
            <XcMenuItem>{
                name: 'Convert into Data Type...', translate: true,
                visible: () => this.variable.isAbstract && !this.readonly, // prototype variable
                click: () => {
                    this.dialogService.custom(
                        LabelPathDialogComponent,
                        <LabelPathDialogData>{
                            header: this.i18n.translate(LabelPathDialogComponent.HEADER_CONVERT_TO_DATA_TYPE),
                            confirm: this.i18n.translate(LabelPathDialogComponent.CONFIRM_CREATE),
                            presetLabel: this.variable?.label ?? '',
                            presetPath: '',
                            pathsObservable: this.documentService.getPaths()
                        }
                    ).afterDismissResult().subscribe(
                        result => {
                            if (result) {
                                this.performAction({
                                    type: ModellingActionType.convert,
                                    objectId: this.variable.id,
                                    request: XoConvertVariableRequest.convertToVariable(ConversionTarget.variable, result.label, result.path)
                                });
                            }
                        }
                    );
                }
            },
            <XcMenuItem>{
                name: 'Remove Dynamic Type',
                translate: true,
                visible: () => this.hasDynamicType && this.variable.allowCast && !this.isLocked(),
                click: () => this.performAction({
                    type: ModellingActionType.change,
                    objectId: this.variable.id,
                    request: XoChangeDynamicTypingRequest.castTo('')
                })
            }
        );

        this.untilDestroyed(this.branchSelection.selectionChange).subscribe(
            () => this.constantMenuItem.name = this.selectedBranch
                ? 'Constant for selected Branch...'
                : 'Constant...'
        );

        this.untilDestroyed(this.detailLevelService.showFQNChange()).subscribe(() => this.updateShowFQN());
    }


    private updateShowFQN() {
        this.showFqn = this.detailLevelService.showFQN || this.variable?.showName;
    }


    private getDocumentRtc(): RuntimeContext {
        return this.documentService.selectedDocument && this.documentService.selectedDocument.item
            ? this.documentService.selectedDocument.item.$rtc.runtimeContext()
            : this.documentService.xmomService.runtimeContext;
    }


    allowItem = (xoFqn: string): boolean =>
        // if casting is allowed for this variable, allow cast to Data Types and Exception Types
        !this.isLocked() && this.variable.allowCast && (
            xoFqn === XoData.fqn.encode().toLowerCase() ||
            xoFqn === XoException.fqn.encode().toLowerCase()
        );


    dropped(event: ModDropEvent) {
        if ((event.item as XoVariable).castToFqn && (event.item as XoVariable).castToFqn.length > 0) {
            // set dynamic type based on another dynamic type (for example self)
            this.performAction({ type: ModellingActionType.change, objectId: this.variable.id, request: XoChangeDynamicTypingRequest.castTo((event.item as XoVariable).castToFqn) });
        } else {
            // set dynamic type
            this.performAction({ type: ModellingActionType.change, objectId: this.variable.id, request: XoChangeDynamicTypingRequest.castTo((event.item as XoVariable).$fqn) });
        }
    }


    toggleMultiplicity() {
        this.performAction({
            request: XoChangeMultiplicityRequest.toList(!this.variable.isList),
            type: ModellingActionType.change,
            objectId: this.variable.id
        });
    }


    doubleClickRim(event: MouseEvent) {
        if (!this.readonly) {
            this.toggleMultiplicity();
        }
        event.stopPropagation();
    }


    @Input()
    set variable(value: XoVariable) {
        this.setModel(value);
        this.updateShowFQN();
    }


    get variable(): XoVariable {
        return this.getModel() as XoVariable;
    }


    get fqn(): string {
        return this.variable.isAbstract ? '[prototype]' : (this.hasDynamicType ? this.variable.castToFqn : this.variable.$fqn);
    }


    get selectedBranch(): XoModellingItem {
        return !!this.branchSelection.selectedObject && !!this.variable ? this.variable.providingBranches.find(branch => branch === this.branchSelection.selectedObject.getModel()) : null;
    }


    get linkStateIn(): string {
        const branch = this.selectedBranch;
        const branchId = branch ? branch.id : null;
        return this.variable.getLinkStateIn(branchId);
    }


    isException(): boolean {
        return this.variable instanceof XoException;
    }


    finishEditing(text: string) {
        if (text !== this.variable.label) {
            this.performAction({
                type: ModellingActionType.change,
                objectId: this.variable.id,
                request: new XoChangeLabelRequest(undefined, text)
            });
        }
    }


    /**
     * @inheritdoc
     */
    allowRegisterAtComponentMapping() {
        // formula variables of a mapping shall not be registered at the mapping service, because they share an ID with the mapping's input or output variable
        const insideMapping = (item: XoReferableObject): boolean => {
            if (item instanceof XoMapping) {
                return true;
            }
            return item.parent && insideMapping(item.parent);
        };
        return this.variable && !(this.variable.parent instanceof XoFormula && insideMapping(this.variable));
    }


    @HostBinding('class.dynamic-typing')
    get hasDynamicType(): boolean {
        return !!this.variable.castToFqn;
    }


    get tooltip(): string {
        if (!this.variable.isAbstract) {
            return this.variable.$fqn + (this.hasDynamicType ? '   >   ' + this.variable.castToFqn : '');
        }
        return '';
    }


    get showMenu(): boolean {
        return this.hasMenu && this.menuItems.some(menuItem => menuItem.visible?.(menuItem));
    }


    @HostBinding('class.prototype')
    get isAbstract(): boolean {
        return this.variable.isAbstract;
    }


    @HostBinding('class.referred')
    get isReferred(): boolean {
        return this.variable.referred;
    }
}
