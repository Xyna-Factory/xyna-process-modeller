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
import { FormulaTreeDataSource } from '../variable-tree/data-source/variable-tree-data-source';


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

    private readonly structureCache = new XoDescriberCache<XoStructureObject>();
    inputDataSources: FormulaTreeDataSource[] = [];
    outputDataSources: FormulaTreeDataSource[] = [];

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
        [...this.inputDataSources, ...this.outputDataSources].forEach(ds => {
            // ds.structureCache = this.structureCache;
            // ds.readonlyMode = true;
            ds.refresh();
        });

        // setTimeout(() => {
        //     this.outputDataSources.forEach(ds => console.log(ds.structureTreeData.map(node => node.name).join('  ')));
        // }, 2000);
    }
}
