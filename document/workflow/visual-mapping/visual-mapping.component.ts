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
import { Subscription, filter, first, forkJoin, tap } from 'rxjs';
import { FlowDefinition } from './flow-canvas/flow-canvas.component';
import { XoMapping } from '@pmod/xo/mapping.model';
import { ComponentMappingService } from '@pmod/document/component-mapping.service';
import { DocumentService } from '@pmod/document/document.service';
import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { SkeletonTreeDataSource, SkeletonTreeDataSourceObserver, SkeletonTreeNode, VariableDescriber } from '../variable-tree/data-source/skeleton-tree-data-source';
import { ModellingActionType, XmomService } from '@pmod/api/xmom.service';
import { CreateAssignmentEvent } from '../variable-tree-node/variable-tree-node.component';
import { XoModelledExpression } from '@pmod/xo/expressions/modelled-expression.model';
import { XoExpressionVariable } from '@pmod/xo/expressions/expression-variable.model';
import { XoSingleVarExpression } from '@pmod/xo/expressions/single-var-expression.model';
import { ModellingObjectComponent } from '../shared/modelling-object.component';
import { FormulaAreaComponent } from '../formula-area/formula-area.component';
import { XoLiteralExpression } from '@pmod/xo/expressions/literal-expression.model';
import { XoExpression2Args } from '@pmod/xo/expressions/expression2-args.model';
import { XoNotExpression } from '@pmod/xo/expressions/not-expression.model';
import { XoVariableInstanceFunctionIncovation } from '@pmod/xo/expressions/variable-instance-function-incovation.model';
import { XoFunctionExpression } from '@pmod/xo/expressions/function-expression.model';



/**
 * Two for each expression (one for source, one for target).
 * Used to store a Skeleton node that matches the expression.
 */
class ExpressionPart {
    private _node: SkeletonTreeNode;

    constructor(public expression: XoExpressionVariable) {
    }

    get node(): SkeletonTreeNode {
        return this._node;
    }

    set node(value: SkeletonTreeNode) {
        this._node = value;

        // mark node and its children for being assigned and uncollapse
        if (this.node) {
            this.node.markRecursively();
            this.node.uncollapseRecursivelyUpwards();
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
        return this.targetPart ?  [...this.sourcePart, this.targetPart] : this.sourcePart;
    }
}



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
    private isRefreshing = false;

    expressions: ExpressionWrapper[];

    //private readonly structureCache = new XoDescriberCache<XoStructureObject>();  TODO use cache
    inputDataSources: FormulaTreeDataSource[] = [];
    outputDataSources: FormulaTreeDataSource[] = [];

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

        // anti-prune
        const p0 = new XoSingleVarExpression();
        const p1 = new XoLiteralExpression();
        const p2 = new XoExpression2Args();
        const p3 = new XoNotExpression();
        const p4 = new XoVariableInstanceFunctionIncovation();
        const p5 = new XoFunctionExpression();

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
        const xmomService = this.injector.get(XmomService);
        const inputVariables = this.mapping.inputArea.variables;
        const outputVariables = this.mapping.outputArea.variables;


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
                            sourceVariable.forEach(variable => variable.variable = mappingVariables[variable.varNum]);
                            const targetVariable = expression.targetPart?.expression;
                            if (targetVariable) {
                                targetVariable.variable = mappingVariables[targetVariable.varNum];
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

        // for each assignment path, traverse formula trees and find matching node
        // this.assignments.forEach(assignment => {
        //     assignment.memberPaths.forEach(path => {
        //         const ds = dataSources[path.formula.variableIndex];
        //         const correspondingNode = ds?.processMemberPath(path.formula);
        //         path.node = correspondingNode;
        //     });
        // });
        this.expressions.forEach(expression => {
            expression.parts.forEach(part => {
                const ds = dataSources[part.expression?.varNum ?? 0];
                const correspondingNode = ds?.processVariable(part.expression);
                part.node = correspondingNode;
            });
        });

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
