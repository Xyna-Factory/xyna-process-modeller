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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService, FullQualifiedName } from '@zeta/api';
import { FormulaTreeDataSource } from '../variable-tree/data-source/formula-tree-data-source';
import { Assignment } from './assignment';
import { Subscription, filter, first, forkJoin } from 'rxjs';
import { FlowDefinition } from './flow-canvas/flow-canvas.component';
import { XoMapping } from '@pmod/xo/mapping.model';
import { ComponentMappingService } from '@pmod/document/component-mapping.service';
import { DocumentService } from '@pmod/document/document.service';
import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { SkeletonTreeDataSource, SkeletonTreeDataSourceObserver, SkeletonTreeNode, VariableDescriber } from '../variable-tree/data-source/skeleton-tree-data-source';
import { ModellingActionType } from '@pmod/api/xmom.service';
import { CreateAssignmentEvent } from '../variable-tree-node/variable-tree-node.component';
import { ModellingObjectComponent } from '../shared/modelling-object.component';
import { FormulaAreaComponent } from '../formula-area/formula-area.component';


@Component({
    selector: 'visual-mapping',
    templateUrl: './visual-mapping.component.html',
    styleUrls: ['./visual-mapping.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualMappingComponent extends ModellingObjectComponent implements OnInit, OnDestroy, SkeletonTreeDataSourceObserver {

    private _mapping: XoMapping;
    private _replacedSubscription: Subscription;
    private _selectionSubscription: Subscription;
    private initialized = false;
    private structuresLoaded = false;

    //private readonly structureCache = new XoDescriberCache<XoStructureObject>();  TODO use cache
    inputDataSources: FormulaTreeDataSource[] = [];
    outputDataSources: FormulaTreeDataSource[] = [];

    assignments: Assignment[] = [];
    flows: FlowDefinition[] = [];

    selectedNode: SkeletonTreeNode;

    @Input()
    set mapping(value: XoMapping) {
        this._replacedSubscription?.unsubscribe();
        this._mapping = value;
        this.update();

        this._replacedSubscription = this.mapping.replaced().subscribe({
            next: () => this.update(),
            error: error => console.warn('error on model replace: ' + error)
        });
    }
    get mapping(): XoMapping {
        return this._mapping;
    }


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        injector: Injector,
        protected readonly cdr: ChangeDetectorRef
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
    }


    ngOnInit(): void {
        this.initialized = true;
        this.update();
    }


    ngOnDestroy(): void {
        this._replacedSubscription?.unsubscribe();
        this._selectionSubscription?.unsubscribe();
    }


    update() {
        if (!this.mapping || !this.initialized) {
            return;
        }
        const apiService = this.injector.get(ApiService);
        const inputVariables = this.mapping.inputArea.variables;
        const outputVariables = this.mapping.outputArea.variables;
        const formulas = this.mapping.formulaArea.formulas;

        // initialize formulas if not initialized yet
        formulas.filter(
            formula => formula.parts.length === 0
        ).forEach(
            formula => formula.parseExpression(apiService, this.documentModel.originRuntimeContext)
        );
        this.assignments = formulas.map(formula => new Assignment(formula));

        this.inputDataSources = [];
        this.outputDataSources = [];

        // create tree data sources
        inputVariables?.forEach((variable, index) => {
            const rtc = variable.$rtc.runtimeContext() ?? this.documentModel.originRuntimeContext;
            const desc = <VariableDescriber>{ rtc: rtc, fqn: FullQualifiedName.decode(variable.$fqn), isList: variable.isList, label: variable.label };
            const ds = new FormulaTreeDataSource(desc, apiService, rtc, this, index);
            this.inputDataSources.push(ds);
        });
        outputVariables?.forEach((variable, index) => {
            const rtc = variable.$rtc.runtimeContext() ?? this.documentModel.originRuntimeContext;
            const desc = <VariableDescriber>{ rtc: rtc, fqn: FullQualifiedName.decode(variable.$fqn), isList: variable.isList, label: variable.label };
            const ds = new FormulaTreeDataSource(desc, apiService, rtc, this, inputVariables.length + index);
            this.outputDataSources.push(ds);
        });

        // initialize tree data sources
        const dataSources = [...this.inputDataSources, ...this.outputDataSources];
        dataSources.forEach(ds => ds.refresh());

        // wait for all data sources
        forkJoin(
            dataSources.map(ds => ds.root$.pipe(
                filter(value => !!value),
                first()
            ))
        ).subscribe(() => {
            this.structuresLoaded = true;
            this.refreshFlow();
        });
    }


    refreshFlow() {
        if (!this.structuresLoaded) {
            return;
        }

        const dataSources = [...this.inputDataSources, ...this.outputDataSources];

        // for each assignment path, traverse formula trees and find matching node
        this.assignments.forEach(assignment => {
            assignment.memberPaths.forEach(path => {
                const ds = dataSources[path.formula.variableIndex];
                const correspondingNode = ds?.processMemberPath(path.formula);
                path.node = correspondingNode;
            });
        });

        // construct flows for graphical representation
        this.flows = this.assignments
            .filter(assignment => !!assignment.destination)
            .map(assignment =>
                assignment.sources.length > 0
                    ? assignment.sources.map(path => (<FlowDefinition>{ source: path.node, destination: assignment.destination.node }))
                    // if there are no source nodes from the tree, this is a literal assignment. Use literal as description
                    : <FlowDefinition>{ source: null, description: assignment.rightExpressionPart, destination: assignment.destination.node }
            ).flat();
        this.cdr.markForCheck();
    }


    addAssignment(assignment: CreateAssignmentEvent) {
        const expression = assignment.destination.toXFL() + '=' + assignment.source.toXFL();
        this.performAction({ type: ModellingActionType.insert, objectId: this.mapping.formulaArea.id, request: FormulaAreaComponent.getInsertRequest(expression) });
    }


    select(node: SkeletonTreeNode) {
        this._selectionSubscription?.unsubscribe();
        if (this.selectedNode) {
            this.selectedNode.selected = false;
        }
        this.selectedNode = node;
        if (node) {
            node.selected = true;
            this._selectionSubscription = node.selectedChange.pipe(filter(value => !value)).subscribe(() => {
                this.selectedNode = undefined;
                this._selectionSubscription?.unsubscribe();
            });
        }
    }


    nodeChange(dataSource: SkeletonTreeDataSource, node: SkeletonTreeNode): void {
        this.refreshFlow();
    }
}
