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
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { SkeletonTreeNode } from '../variable-tree/data-source/skeleton-tree-data-source';
import { coerceBoolean } from '@zeta/base';


@Component({
    selector: 'variable-tree-node',
    templateUrl: './variable-tree-node.component.html',
    styleUrls: ['./variable-tree-node.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VariableTreeNodeComponent implements AfterViewInit {
    private _node: SkeletonTreeNode<Element>;
    private _highlightMarks = true;

    expanded = true;

    @ViewChild('noderow') nodeElement: ElementRef<Element>;

    @Input()
    set node(value: SkeletonTreeNode<Element>) {
        this._node = value;
        if (this._node && this.nodeElement) {
            this._node.graphicalRepresentation = this.nodeElement.nativeElement;
        }
    }

    get node(): SkeletonTreeNode<Element> {
        return this._node;
    }


    @Input()
    set highlightMarks(value: boolean) {
        this._highlightMarks = coerceBoolean(value);
    }

    get highlightMarks(): boolean {
        return this._highlightMarks;
    }


    ngAfterViewInit(): void {
        this.node.graphicalRepresentation = this.nodeElement.nativeElement;
    }


    get typeLabel(): string {
        return this.node.typeLabel + (this.node.isList ? '[]' : '');
    }
}
