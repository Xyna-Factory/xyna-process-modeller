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
import { XoVariable } from '../../../xo/variable.model';
import { FormulaAreaComponent } from '../formula-area/formula-area.component';
import { ApiService, FullQualifiedName, XoDescriber } from '@zeta/api';
import { FormulaTreeDataSource } from '../variable-tree/data-source/formula-tree-data-source';
import { XoFormula } from '../../../xo/formula.model';
import { Assignment } from './assignment';
import { Subscription, filter, first, forkJoin } from 'rxjs';
import { FlowDefinition } from './flow-canvas/flow-canvas.component';
import { XoMapping } from '@pmod/xo/mapping.model';
import { ComponentMappingService } from '@pmod/document/component-mapping.service';
import { DocumentService } from '@pmod/document/document.service';
import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { VariableDescriber } from '../variable-tree/data-source/skeleton-tree-data-source';


@Component({
    selector: 'visual-mapping',
    templateUrl: './visual-mapping.component.html',
    styleUrls: ['./visual-mapping.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualMappingComponent extends FormulaAreaComponent implements OnInit, OnDestroy {

    // private _inputVariables: XoVariable[];
    // private _outputVariables: XoVariable[];
    // private _formulas: XoFormula[];

    // @Input()
    // set inputVariables(values: XoVariable[]) {
    //     this._inputVariables = values;
    //     this.update();
    // }
    // get inputVariables(): XoVariable[] {
    //     return this._inputVariables;
    // }

    // @Input()
    // set outputVariables(values: XoVariable[]) {
    //     this._outputVariables = values;
    //     this.update();
    // }
    // get outputVariables(): XoVariable[] {
    //     return this._outputVariables;
    // }

    // @Input()
    // set formulas(values: XoFormula[]) {
    //     this._formulas = values;
    //     this.update();
    // }
    // get formulas(): XoFormula[] {
    //     return this._formulas;
    // }

    private _mapping: XoMapping;
    private _replacedSubscription: Subscription;

    @Input()
    set mapping(value: XoMapping) {
        this._replacedSubscription?.unsubscribe();
        this._mapping = value;
        this.update();

        this._replacedSubscription = this.mapping.replaced().subscribe(
            () => {
                console.log('replaced');
                this.update();
            },
            error => console.warn('error on model replace: ' + error));
    }
    get mapping(): XoMapping {
        return this._mapping;
    }

    //private readonly structureCache = new XoDescriberCache<XoStructureObject>();  TODO use cache
    inputDataSources: FormulaTreeDataSource<Element>[] = [];
    outputDataSources: FormulaTreeDataSource<Element>[] = [];

    assignments: Assignment<Element>[] = [];
    flows: FlowDefinition[] = [];
    private _initialized = false;


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
        this._initialized = true;
        this.update();
    }


    ngOnDestroy(): void {
        this._replacedSubscription?.unsubscribe();
    }


    update() {
        if (!this.mapping || !this._initialized) {
            return;
        }
        console.log('update');
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
        console.log('parsed formula exp: ' + formulas.length);

        this.inputDataSources = [];
        this.outputDataSources = [];

        // create tree data sources
        inputVariables?.forEach(variable => {
            const rtc = variable.$rtc.runtimeContext() ?? this.documentModel.originRuntimeContext;
            const desc = <VariableDescriber>{ rtc: rtc, fqn: FullQualifiedName.decode(variable.$fqn), isList: variable.isList };
            const ds = new FormulaTreeDataSource<Element>(desc, apiService, rtc);
            this.inputDataSources.push(ds);
        });
        outputVariables?.forEach(variable => {
            const rtc = variable.$rtc.runtimeContext() ?? this.documentModel.originRuntimeContext;
            const desc = <VariableDescriber>{ rtc: rtc, fqn: FullQualifiedName.decode(variable.$fqn), isList: variable.isList };
            const ds = new FormulaTreeDataSource<Element>(desc, apiService, rtc);
            this.outputDataSources.push(ds);
        });

        // initialize tree data sources
        const dataSources = [...this.inputDataSources, ...this.outputDataSources];
        dataSources.forEach(ds => {
            ds.refresh();
        });

        console.log('waiting for ds\'s to refresh');
        // wait for all data sources
        forkJoin(
            dataSources.map(ds => ds.root$.pipe(
                filter(value => !!value),
                first()
            ))
        ).subscribe(() => {
            console.log('all ds\'s refreshed');
            // construct assignments out of formulas and match with formula trees
            this.assignments = formulas.map(formula => new Assignment<Element>(formula));
            console.log('created assignments: ' + this.assignments.length);
            this.assignments.forEach(assignment => {
                assignment.memberPaths.forEach(path => {
                    const ds = dataSources[path.formula.variableIndex];
                    const correspondingNode = ds?.processMemberPath(path.formula);
                    path.node = correspondingNode;
                });
            });
            console.log('retrieved assignment nodes');

            // construct flows for graphical representation
            this.flows = this.assignments.map(assignment =>
                assignment.sources.map(path => (<FlowDefinition>{ source: path.node, destination: assignment.destination.node }))
            ).flat();
            console.log('constructed flows: ' + this.flows.length);
            this.cdr.markForCheck();
        });
    }
}
