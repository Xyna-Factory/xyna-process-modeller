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
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormulaTreeDataSource } from './data-source/variable-tree-data-source';


@Component({
    selector: 'variable-tree',
    templateUrl: './variable-tree.component.html',
    styleUrls: ['./variable-tree.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VariableTreeComponent {
    private _dataSource: FormulaTreeDataSource;


    @Input('xc-tree-datasource')
    set dataSource(value: FormulaTreeDataSource) {
        // this.unsubscribeDataSource();
        this._dataSource = value;
        if (this.dataSource) {
            // subscribe to mark for changes
            // this._dataSourceSubscriptions.push(
            //     this.dataSource.markForChange.subscribe(() => {
            //         this.cdRef.markForCheck();
            //     })
            // );
            // subscribe to data changes
            // this._dataSourceSubscriptions.push(
            //     this.dataSource.dataChange.pipe<XcTreeNode[]>(
            //         filter(nodes => this.autoExpand && nodes.length > 0)
            //     ).subscribe(nodes =>
            //         nodes.forEach(node => {
            //             if (this.autoExpand === 'first') {
            //                 this.treeControl.expand(node);
            //             } else if (this.autoExpand === 'all') {
            //                 const expandChildren = (parentNode: XcTreeNode) => {
            //                     this.treeControl.expand(parentNode);
            //                     this._dataSourceSubscriptions.push(parentNode.children.pipe(filter(children => children.length > 0)).subscribe(children =>
            //                         children.forEach(child => expandChildren(child))
            //                     ));
            //                 };
            //                 expandChildren(node);
            //             }
            //         })
            //     )
            // );
        }
    }


    get dataSource(): FormulaTreeDataSource {
        return this._dataSource;
    }
}
