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
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { TreeNodeObserver } from '../variable-tree/data-source/skeleton-tree-data-source';
import { coerceBoolean } from '@zeta/base';
import { ModDragEvent, ModDropEvent, ModDropAreaDirective } from '../shared/drag-and-drop/mod-drop-area.directive';
import { Draggable, ModDnDEvent } from '../shared/drag-and-drop/mod-drag-and-drop.service';
import { SkeletonTreeNode } from '../variable-tree/data-source/skeleton-tree-node';
import { NgClass, AsyncPipe } from '@angular/common';
import { ModDraggableDirective } from '../shared/drag-and-drop/mod-draggable.directive';
import { XcModule } from '../../../../../zeta/xc/xc.module';


export interface CreateAssignmentEvent {
    destination: SkeletonTreeNode;
    source: SkeletonTreeNode;
}


@Component({
    selector: 'variable-tree-node',
    templateUrl: './variable-tree-node.component.html',
    styleUrls: ['./variable-tree-node.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, ModDraggableDirective, ModDropAreaDirective, XcModule, AsyncPipe]
})
export class VariableTreeNodeComponent implements AfterViewInit, TreeNodeObserver {
    protected readonly cdr = inject(ChangeDetectorRef);

    private _node: SkeletonTreeNode;
    private _highlightMarks = false;

    expanded = true;

    @ViewChild('noderow') nodeElement: ElementRef<Element>;

    @Output()
    readonly assignedVariable = new EventEmitter<CreateAssignmentEvent>();

    @Input()
    set node(value: SkeletonTreeNode) {
        this.node?.removeObserver(this);
        this._node = value;
        if (this._node && this.nodeElement) {
            this._node.graphicalRepresentation = this.nodeElement.nativeElement;
        }
        this.node?.addObserver(this);
    }

    get node(): SkeletonTreeNode {
        return this._node;
    }


    @Input()
    set highlightMarks(value: boolean) {
        this._highlightMarks = coerceBoolean(value);
    }

    get highlightMarks(): boolean {
        return this._highlightMarks;
    }

    @Output()
    readonly selectionChange = new EventEmitter<SkeletonTreeNode>();


    select(node: SkeletonTreeNode) {
        this.selectionChange.emit(node);
    }


    ngAfterViewInit(): void {
        this.node.graphicalRepresentation = this.nodeElement.nativeElement;
    }


    get typeLabel(): string {
        return this.node.typeLabel;
    }


    toggle(event: MouseEvent) {
        if (this.node.collapsed) {
            this.node.uncollapse();
        } else {
            this.node.collapse();
        }
    }


    nodeChange(node: SkeletonTreeNode): void {
        this.cdr.markForCheck();
    }


    allowItem = (xoFqn: string): boolean => true;

    canDrop = (draggable: Draggable, hoverEvent?: ModDragEvent, dragEvent?: ModDnDEvent): boolean => draggable instanceof SkeletonTreeNode;

    dropped(event: ModDropEvent<Draggable>) {
        this.assignedVariable.emit(<CreateAssignmentEvent>{ destination: this.node, source: event.item as SkeletonTreeNode });
    }
}
