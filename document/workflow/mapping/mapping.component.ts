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
import { Component, ElementRef, Injector, Input, OnDestroy, Optional } from '@angular/core';

import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { XcMenuItem } from '@zeta/xc';

import { Subscription } from 'rxjs';

import { ModellingActionType } from '../../../api/xmom.service';
import { ComponentMappingService } from '../../../document/component-mapping.service';
import { DocumentService } from '../../../document/document.service';
import { SelectionService } from '../../../document/selection.service';
import { XoMapping } from '../../../xo/mapping.model';
import { XoRequest } from '../../../xo/request.model';
import { XoTextArea } from '../../../xo/text-area.model';
import { XoVariable } from '../../../xo/variable.model';
import { ModellingItemComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'mapping',
    templateUrl: './mapping.component.html',
    styleUrls: ['./mapping.component.scss']
})
export class MappingComponent extends ModellingItemComponent implements OnDestroy {

    private readonly _selectionChangeSubscription: Subscription;

    newFormulaExpression = '';


    constructor(@Optional() elementRef: ElementRef,
        @Optional() componentMappingService: ComponentMappingService,
        @Optional() documentService: DocumentService,
        readonly selectionService: SelectionService,
        readonly detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        this.menuItems.unshift(
            <XcMenuItem>{ name: 'Show/Hide Documentation Area', translate: true,
                visible: () => !!this.mapping.documentationArea,
                click:   () => detailLevelService.toggleCollapsed(this.mapping.documentationArea.id)
            },
            <XcMenuItem>{ name: 'Sort Assignments', translate: true,
                click: () => this.performAction({
                    type: ModellingActionType.sort,
                    objectId: this.mapping.formulaArea.id,
                    request: new XoRequest()
                })
            },
            <XcMenuItem>{ name: 'Show/Hide Formulas', translate: true,
                click: () => this.toggleCollapsed()
            }
        );

        this._selectionChangeSubscription = selectionService.selectionChange.subscribe(component => {
            // TODO: limit to mappings where component is descendant of to improve performance
            if (this.mapping) {
                const variables: XoVariable[] = Array.prototype.concat(
                    this.mapping.inputArea  ? this.mapping.inputArea.variables  : [],
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
}
