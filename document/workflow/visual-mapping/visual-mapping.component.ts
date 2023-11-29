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
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { XoVariable } from '@pmod/xo/variable.model';
import { FormulaAreaComponent } from '../formula-area/formula-area.component';
import { ApiService, FullQualifiedName, XoDescriber, XoDescriberCache, XoStructureObject } from '@zeta/api';
import { FormulaTreeDataSource } from '../variable-tree/data-source/formula-tree-data-source';
import { XoFormula } from '@pmod/xo/formula.model';
import { Assignment } from './assignment';
import { filter, first } from 'rxjs';


@Component({
    selector: 'visual-mapping',
    templateUrl: './visual-mapping.component.html',
    styleUrls: ['./visual-mapping.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualMappingComponent extends FormulaAreaComponent implements OnInit {

    @Input()
    inputVariables: XoVariable[];

    @Input()
    outputVariables: XoVariable[];

    @Input()
    formulas: XoFormula[];

    private readonly structureCache = new XoDescriberCache<XoStructureObject>();
    inputDataSources: FormulaTreeDataSource[] = [];
    outputDataSources: FormulaTreeDataSource[] = [];

    assignments: Assignment[] = [];

    ngOnInit(): void {
        const apiService = this.injector.get(ApiService);

        // create tree data sources
        this.inputVariables?.forEach(variable => {
            const desc = <XoDescriber>{ rtc: this.documentModel.originRuntimeContext, fqn: FullQualifiedName.decode(variable.$fqn) };
            const ds = new FormulaTreeDataSource(desc, apiService, this.documentModel.originRuntimeContext);
            this.inputDataSources.push(ds);
        });
        this.outputVariables?.forEach(variable => {
            const desc = <XoDescriber>{ rtc: this.documentModel.originRuntimeContext, fqn: FullQualifiedName.decode(variable.$fqn) };
            const ds = new FormulaTreeDataSource(desc, apiService, this.documentModel.originRuntimeContext);
            this.outputDataSources.push(ds);
        });

        // initialize tree data sources
        const dataSources = [...this.inputDataSources, ...this.outputDataSources];
        dataSources.forEach(ds => {
            ds.refresh();
        });


        this.assignments = this.formulas.map(formula => new Assignment(formula));
        this.assignments.forEach(assignment => {
            assignment.memberPaths.forEach(path => {
                const ds = dataSources[path.formula.variableIndex];
                ds.root$.pipe(
                    filter(value => !!value),
                    first()
                ).subscribe(() => {
                    const correspondingNode = ds?.processMemberPath(path.formula);
                    path.node = correspondingNode;
                });
            });
        });
    }

}
