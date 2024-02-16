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
import { ApiService, FullQualifiedName, XoDescriberCache, XoStructureObject } from '@zeta/api';
import { Subscription, filter, first, forkJoin, of, tap } from 'rxjs';
import { FlowDefinition } from './flow-canvas/flow-canvas.component';
import { XoMapping } from '@pmod/xo/mapping.model';
import { ComponentMappingService } from '@pmod/document/component-mapping.service';
import { DocumentService } from '@pmod/document/document.service';
import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { SkeletonTreeDataSource, SkeletonTreeDataSourceObserver, StructureProcessWrapper, VariableDescriber } from '../variable-tree/data-source/skeleton-tree-data-source';
import { ModellingActionType, XmomService } from '@pmod/api/xmom.service';
import { CreateAssignmentEvent } from '../variable-tree-node/variable-tree-node.component';
import { XoModelledExpression } from '@pmod/xo/expressions/modelled-expression.model';
import { XoSingleVarExpression } from '@pmod/xo/expressions/single-var-expression.model';
import { ModellingObjectComponent } from '../shared/modelling-object.component';
import { FormulaAreaComponent } from '../formula-area/formula-area.component';
import { XoLiteralExpression } from '@pmod/xo/expressions/literal-expression.model';
import { XoExpression2Args } from '@pmod/xo/expressions/expression2-args.model';
import { XoNotExpression } from '@pmod/xo/expressions/not-expression.model';
import { XoVariableInstanceFunctionIncovation } from '@pmod/xo/expressions/variable-instance-function-incovation.model';
import { XoFunctionExpression } from '@pmod/xo/expressions/function-expression.model';
import { RecursiveStructure } from '@pmod/xo/expressions/RecursiveStructurePart';
import { XoCastExpression } from '@pmod/xo/expressions/cast-expression.model';
import { SkeletonTreeNode } from '../variable-tree/data-source/skeleton-tree-node';



/**
 * Two for each expression (one for source, one for target).
 * Used to store a Skeleton node that matches the expression.
 */
class ExpressionPart {
    private _node: SkeletonTreeNode;

    constructor(public expression: RecursiveStructure) {
    }

    get node(): SkeletonTreeNode {
        return this._node;
    }

    set node(value: SkeletonTreeNode) {
        this._node = value;

        // mark node and its children for being assigned and uncollapse
        if (this.node) {
            this.node.markRecursively();
        }
    }
}

class ExpressionWrapper {
    sourcePart: ExpressionPart[];
    targetPart: ExpressionPart;

    constructor(protected expression: XoModelledExpression) {
        const rightExpression = expression.sourceExpression.extractInvolvedVariable();
        const leftExpression = expression.targetExpression.extractInvolvedVariable();
        this.sourcePart = [...leftExpression.slice(1), ...rightExpression].map(exp => new ExpressionPart(exp));
        this.targetPart = leftExpression.length > 0 ? new ExpressionPart(leftExpression[0]) : undefined;
    }

    get parts(): ExpressionPart[] {
        return this.targetPart ? [...this.sourcePart, this.targetPart] : this.sourcePart;
    }
}



@Component({
    selector: 'visual-mapping',
    templateUrl: './visual-mapping.component.html',
    styleUrls: ['./visual-mapping.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualMappingComponent extends ModellingObjectComponent implements OnInit, OnDestroy, SkeletonTreeDataSourceObserver {

    private _replacedSubscription: Subscription;
    private _selectionSubscription: Subscription;
    private initialized = false;
    private structuresLoaded = false;
    private isRefreshing = false;

    expressions: ExpressionWrapper[];

    private readonly structureCache = new XoDescriberCache<XoStructureObject>(1000);
    inputDataSources: SkeletonTreeDataSource[] = [];
    outputDataSources: SkeletonTreeDataSource[] = [];

    flows: FlowDefinition[] = [];

    selectedNode: SkeletonTreeNode;

    @Input()
    set mapping(value: XoMapping) {
        this._replacedSubscription?.unsubscribe();
        this.setModel(value);
        this.update();

        this._replacedSubscription = this.mapping.replaced().subscribe({
            next: () => this.update(),
            error: error => console.warn('error on model replace: ' + error)
        });
    }
    get mapping(): XoMapping {
        return this.getModel() as XoMapping;
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

        // anti-prune
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const p0 = new XoSingleVarExpression();
        const p1 = new XoLiteralExpression();
        const p2 = new XoExpression2Args();
        const p3 = new XoNotExpression();
        const p4 = new XoVariableInstanceFunctionIncovation();
        const p5 = new XoFunctionExpression();
        const p6 = new XoCastExpression();
        /* eslint-enable @typescript-eslint/no-unused-vars */

    }


    ngOnInit(): void {
        super.ngOnInit();
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
        const xmomService = this.injector.get(XmomService);
        const inputVariables = this.mapping.inputArea.variables;
        const outputVariables = this.mapping.outputArea.variables;

        if (this.needToRebuildTrees()) {
            this.inputDataSources = [];
            this.outputDataSources = [];

            // create and initialize tree data sources
            inputVariables?.forEach((variable, index) => {
                const rtc = variable.$rtc.runtimeContext() ?? this.documentModel.originRuntimeContext;
                const desc = new VariableDescriber(rtc, FullQualifiedName.decode(variable.$fqn), variable.isList, variable.label);
                const ds = new SkeletonTreeDataSource(desc, apiService, rtc, this, index, this.structureCache);
                ds.refresh();
                this.inputDataSources.push(ds);
            });
            outputVariables?.forEach((variable, index) => {
                const rtc = variable.$rtc.runtimeContext() ?? this.documentModel.originRuntimeContext;
                const desc = new VariableDescriber(rtc, FullQualifiedName.decode(variable.$fqn), variable.isList, variable.label);
                const ds = new SkeletonTreeDataSource(desc, apiService, rtc, this, inputVariables.length + index, this.structureCache);
                ds.refresh();
                this.outputDataSources.push(ds);
            });
        }

        const dataSources = [...this.inputDataSources, ...this.outputDataSources];

        // wait for all data sources
        forkJoin(
            [
                dataSources.map(ds => ds.root$.pipe(
                    filter(value => !!value),
                    first()
                )),
                xmomService.getModelledExpressions(this.documentModel.item, this.mapping).pipe(
                    tap(expressions => {
                        const mappingVariables = this.mapping.inputArea.variables.concat(this.mapping.outputArea.variables);
                        this.expressions = expressions.data.map(modelledExpression => new ExpressionWrapper(modelledExpression));
                        // assign XoVariables to ExpressionVariables
                        this.expressions.forEach(expression => {
                            const sourceVariable = expression.sourcePart.map(part => part.expression);
                            sourceVariable.forEach(variable => variable.getVariable().variable = mappingVariables[variable.getVariable().varNum]);
                            const targetVariable = expression.targetPart?.expression;
                            if (targetVariable) {
                                targetVariable.getVariable().variable = mappingVariables[targetVariable.getVariable().varNum];
                            }
                        });
                    })
                )
            ]
        ).subscribe(() => {
            this.structuresLoaded = true;
            this.refreshFlow();
        });
    }


    refreshFlow() {
        if (!this.structuresLoaded || this.isRefreshing) {
            return;
        }
        this.isRefreshing = true;

        const dataSources = [...this.inputDataSources, ...this.outputDataSources];

        dataSources.forEach(ds => ds.clearMarks());

        const pairs: StructureProcessWrapper[][] = dataSources.map(() => <StructureProcessWrapper[]>[]);

        this.expressions.forEach(expression => {
            expression.parts.forEach(part => {
                const index = part.expression?.getVariable().varNum ?? 0;
                const pair: StructureProcessWrapper = {structure: part.expression, postProcess: node => of(part.node = node)};
                pairs[index].push(pair);
            });
        });

        forkJoin(pairs.map((pair, index) => dataSources[index].processStructure(pair))).subscribe({
            complete: () => {
                // construct flows for graphical representation
                this.flows = this.expressions
                    .filter(expression => !!expression.targetPart)
                    .flatMap(expression =>
                        expression.sourcePart.length > 0
                            ? expression.sourcePart.map(part => <FlowDefinition>{ source: part.node, destination: expression.targetPart.node })
                            // if there are no source nodes from the tree, this is a literal assignment. Use literal as description
                            : <FlowDefinition>{ source: null, description: '<literal>', destination: expression.targetPart.node }
                    );
                this.cdr.markForCheck();
                this.isRefreshing = false;
            }
        });
    }


    private needToRebuildTrees(): boolean {
        if (this.inputDataSources.length !== this.mapping.inputArea.variables.length) {
            return true;
        }
        if (this.outputDataSources.length !== this.mapping.outputArea.variables.length) {
            return true;
        }
        for (let i = 0; i < this.inputDataSources.length; i++) {
            const ds = this.inputDataSources[i];
            const variable = this.mapping.inputArea.variables[i];
            if (!ds.variableDescriber.compare(variable)) {
                return true;
            }
        }
        for (let i = 0; i < this.outputDataSources.length; i++) {
            const ds = this.outputDataSources[i];
            const variable = this.mapping.outputArea.variables[i];
            if (!ds.variableDescriber.compare(variable)) {
                return true;
            }
        }
        return false;
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


    getCollapseId(): string {
        return this.mapping.formulaArea.id;
    }


    isDefaultCollapsed(): boolean {
        return !this.detailSettings.showMappings;
    }
}
