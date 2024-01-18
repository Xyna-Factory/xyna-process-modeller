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
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormulaTreeDataSource } from './data-source/formula-tree-data-source';
import { coerceBoolean } from '@zeta/base';
import { SkeletonTreeNode } from './data-source/skeleton-tree-data-source';
import { CreateAssignmentEvent } from '../variable-tree-node/variable-tree-node.component';


@Component({
    selector: 'variable-tree',
    templateUrl: './variable-tree.component.html',
    styleUrls: ['./variable-tree.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VariableTreeComponent {
    private _dataSource: FormulaTreeDataSource;
    private _highlightMarkedNodes = true;

    @Output()
    readonly createdAssignment = new EventEmitter<CreateAssignmentEvent>();

    @Input('tree-datasource')
    set dataSource(value: FormulaTreeDataSource) {
        this._dataSource = value;
    }


    get dataSource(): FormulaTreeDataSource {
        return this._dataSource;
    }


    @Input()
    set highlightMarkedNodes(value: boolean) {
        this._highlightMarkedNodes = coerceBoolean(value);
    }

    get highlightMarkedNodes(): boolean {
        return this._highlightMarkedNodes;
    }


    @Output()
    readonly selectionChange = new EventEmitter<SkeletonTreeNode>();


    select(node: SkeletonTreeNode) {
        this.selectionChange.emit(node);
    }
}
