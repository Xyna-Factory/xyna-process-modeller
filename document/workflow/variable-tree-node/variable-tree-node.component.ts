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
import { SkeletonTreeNode } from '../variable-tree/data-source/skeleton-tree-data-source';


@Component({
    selector: 'variable-tree-node',
    templateUrl: './variable-tree-node.component.html',
    styleUrls: ['./variable-tree-node.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VariableTreeNodeComponent {
    private _node: SkeletonTreeNode;

    expanded = true;

    @Input()
    set node(value: SkeletonTreeNode) {
        // this.subscription?.unsubscribe();
        this._node = value;
        // this.subscription = this.node?.children.subscribe(
        //     () => this.cdr.markForCheck()
        // );

        // // set action callback to toggle node
        // this.node.action = () => this.expandRecursively();

        // // calculate indentation for this node, depending on its depth
        // const depth = (node: XcStructureTreeNode): number => node.parent ? depth(node.parent) + 1 : 1;
        // this.indentation = XcTreeItemComponent.INDENTATION * depth(this._node);
    }


    get node(): SkeletonTreeNode {
        return this._node;
    }
}
