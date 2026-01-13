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
import { Component, inject, Input, OnDestroy } from '@angular/core';

import { SelectionService } from '@pmod/document/selection.service';
import { MappingMode, WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { XcDialogService, XcMenuItem } from '@zeta/xc';

import { filter, Subscription } from 'rxjs';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoMapping } from '../../../xo/mapping.model';
import { XoRequest } from '../../../xo/request.model';
import { XoTextArea } from '../../../xo/text-area.model';
import { XoVariable } from '../../../xo/variable.model';
import { ModellingItemComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'mapping',
    templateUrl: './mapping.component.html',
    styleUrls: ['./mapping.component.scss'],
    standalone: false
})
export class MappingComponent extends ModellingItemComponent implements OnDestroy {

    protected readonly detailLevelService = inject(WorkflowDetailLevelService);
    protected readonly apiService = inject(ApiService);
    protected readonly dialogs = inject(XcDialogService);
    protected readonly selectionService = inject(SelectionService);

    private readonly language = {
        showHideDocumentation: 'pmod.workflow.show-hide-documentation',
        sortAssignments: 'pmod.workflow.sort-assignments',
        showHideFormulas: 'pmod.workflow.show-hide-formulas',
        programmaticMode: 'pmod.workflow.switch-to-programmatic-mode',
        visualMode: 'pmod.workflow.switch-to-visual-mode'
    };

    private readonly _selectionChangeSubscription: Subscription;
    private readonly defaultMenuItems: XcMenuItem[];

    newFormulaExpression = '';

    get programmaticMode(): boolean {
        return this.detailLevelService.getMappingMode(this.mapping?.id) === MappingMode.PROGRAMMATIC;
    }
    get visualMode(): boolean {
        return this.detailLevelService.getMappingMode(this.mapping?.id) === MappingMode.VISUAL;
    }


    constructor() {
        super();

        this.defaultMenuItems = [
            <XcMenuItem>{
                name: this.language.showHideDocumentation, translate: true,
                visible: () => !!this.mapping.documentationArea,
                click: () => this.detailLevelService.toggleCollapsed(this.mapping.documentationArea.id)
            },
            <XcMenuItem>{
                name: this.language.sortAssignments, translate: true,
                click: () => this.performAction({
                    type: ModellingActionType.sort,
                    objectId: this.mapping.formulaArea.id,
                    request: new XoRequest()
                })
            },
            <XcMenuItem>{
                name: this.language.showHideFormulas, translate: true,
                click: () => this.toggleCollapsed()
            },
            <XcMenuItem>{
                name: this.visualMode ? this.language.programmaticMode : this.language.visualMode, translate: true,
                click: item => {
                    this.detailLevelService.setMappingMode(
                        this.mapping.id, this.visualMode ? MappingMode.PROGRAMMATIC : MappingMode.VISUAL);
                    item.name = this.visualMode ? this.language.programmaticMode : this.language.visualMode;
                }
            },
            ...this.menuItems
        ];

        this._selectionChangeSubscription = this.selectionService.selectionChange.subscribe(component => {
            // TODO: limit to mappings where component is descendant of to improve performance
            if (this.mapping) {
                const variables: XoVariable[] = Array.prototype.concat(
                    this.mapping.inputArea ? this.mapping.inputArea.variables : [],
                    this.mapping.outputArea ? this.mapping.outputArea.variables : []
                );
                // un-refer all variables first
                variables.forEach(variable => variable.referred = false);
                // refer selected variable, if any
                if (component) {
                    const selectedId = component.getModel().id;
                    const selectedVariable = variables.find(variable => variable.id === selectedId);
                    if (selectedVariable) {
                        selectedVariable.referred = true;
                    }
                }
            }
        });
    }


    ngOnDestroy(): void {
        if (this._selectionChangeSubscription) {
            this._selectionChangeSubscription.unsubscribe();
        }
        super.ngOnDestroy();
    }


    @Input()
    set mapping(value: XoMapping) {
        this.setModel(value);
        if (this.mapping.plugin) {
            this.updateMenuEntries();
        }
    }


    get mapping(): XoMapping {
        return this.getModel() as XoMapping;
    }


    get documentationArea(): XoTextArea {
        return this.mapping.documentationArea;
    }


    modelChanged() {
        super.modelChanged();

        // default formula expression shall be the mapping's first unassigned output
        // find unassigned outputs
        const expressions = this.mapping?.formulaArea?.formulas.map(formula => formula.expression).join('') ?? '';
        const numInputs = this.mapping?.inputArea.variables?.length ?? 0;
        const outputs = this.mapping?.outputArea?.variables.map((v: XoVariable, i: number) => `%${numInputs + i}%`);

        // take first unsassigned output index (or the only one, if there's only one output)
        this.newFormulaExpression = outputs.length === 1
            ? outputs[0]
            : outputs.find(output => !expressions.includes(output)) ?? '';
    }


    toggleCollapsed() {
        this.detailLevelService.toggleCollapsed(this.mapping.formulaArea.id);
    }


    isDefaultCollapsed(): boolean {
        return false;
    }

    updateMenuEntries() {
        this.menuItems = this.defaultMenuItems;
        this.menuItems.push(
            ...this.mapping.plugin.menuEntry.data.map(entry =>
                <XcMenuItem>{
                    name: entry.navigationEntryLabel,
                    click: () => this.apiService.startOrder(
                        entry.runtimeContext.toRuntimeContext(),
                        entry.fQN,
                        this.mapping.plugin.context,
                        null,
                        new StartOrderOptionsBuilder().withErrorMessage(true).options
                    ).pipe(
                        filter(result => {
                            if (result.errorMessage) {
                                this.dialogs.error(result.errorMessage);
                                return false;
                            }
                            return true;
                        })
                    ).subscribe()
                }
            )
        );
    }
}
