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
import { NgFor } from '@angular/common';
import { Component, effect, HostBinding, Input, input } from '@angular/core';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoInsertModellingObjectRequest } from '../../../xo/insert-modelling-object-request.model';
import { XoModellingItem } from '../../../xo/modelling-item.model';
import { XoMoveModellingObjectRequest } from '../../../xo/move-modelling-object-request.model';
import { XoVariableArea } from '../../../xo/variable-area.model';
import { XoVariable } from '../../../xo/variable.model';
import { DragType, ModDnDEvent } from '../shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDraggableDirective } from '../shared/drag-and-drop/mod-draggable.directive';
import { ModDragEvent, ModDropAreaDirective, ModDropEvent } from '../shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent } from '../shared/modelling-object.component';
import { VariableComponent } from '../variable/variable.component';


@Component({
    selector: 'variable-area',
    templateUrl: './variable-area.component.html',
    styleUrls: ['./variable-area.component.scss'],
    imports: [ModDropAreaDirective, NgFor, VariableComponent, ModDraggableDirective]
})
export class VariableAreaComponent extends ModellingObjectComponent {
    readonly variableAreaInput = input<XoVariableArea>(null, { alias: 'variableArea' });
    private _kind: 'input-area' | 'output-area' | 'throws-area';
    readonly trackById = (_index: number, variable: XoVariable) => variable?.id;

    constructor() {
        super();
        effect(() => this.setModel(this.variableAreaInput()));
        this.untilDestroyed(this.documentService.documentChange).subscribe(change => {
            if (change.item === this.documentModel?.item) {
                this.cdr.detectChanges();
            }
        });
    }

    allowItem = (xoFqn: string): boolean => {
        const allowedType = !!this.variableArea.itemTypes.find(itemType => itemType.toLowerCase() === xoFqn.toLowerCase());
        return allowedType && !this.readonly;
    };

    canDrop = (xo: XoModellingItem, hoverEvent?: ModDragEvent, dragEvent?: ModDnDEvent): boolean => {

        // FIXME use flag "positionChangeable" instead of "deletable" (in both cases below) (see PMOD-574)

        // forbid drop, if
        // 1. operation is MOVE and xo shall not change its position or if
        // 2. there's a position-fixed variable right to the insert position (which would change its position +1 on insert)
        const moving = !!dragEvent && !!(dragEvent.dataTransfer as DataTransfer) && (dragEvent.dataTransfer as DataTransfer).dropEffect === 'move';
        const mappedComponent = xo?.id ? this.componentMappingService.getComponentForId(this.documentModel?.item, xo.id) : undefined;
        const isMappedVariable = mappedComponent instanceof VariableComponent;
        if (moving && !xo.deletable && !isMappedVariable) {
            return false;
        }
        return !this.variableArea.variables.find((variable, index) => index >= hoverEvent.index && !variable.deletable);
    };


    dropped(event: ModDropEvent<XoModellingItem>) {
        // decrease target index when moving the source forward
        if (event.sameArea && event.operation === DragType.move && event.index > event.sourceIndex) {
            event.index--;
        }

        const previewInsert = (item: XoModellingItem) => {
            this.variableArea.items.data.splice(event.index, 0, item);
            this.cdr.markForCheck();
        };

        // --< INSERT >--
        if (event.operation === DragType.insert) {
            previewInsert(event.item);
            this.performAction({
                type: ModellingActionType.insert,
                objectId: this.variableArea.id,
                request: new XoInsertModellingObjectRequest(
                    undefined,
                    this.variableArea.getTargetIndex(event.sameArea, false, event.index),
                    event.item.createInsertRequestContent()
                )
            });
        } else if (event.operation === DragType.copy) {

            // --< COPY >--
            previewInsert(event.item.clone());
            this.performAction({
                type: ModellingActionType.copy,
                objectId: event.item.id,
                request: new XoMoveModellingObjectRequest(
                    undefined,
                    this.variableArea.getTargetIndex(event.sameArea, false, event.index),
                    this.variableArea.id
                )
            });
        } else if (event.operation === DragType.move) {

            // --< MOVE >--
            // target index must be different from source index, if inserting into the same area
            if (!event.sameArea || event.sourceIndex !== event.index) {
                if (event.sameArea) {
                    const movedItem = this.variableArea.items.data.splice(event.sourceIndex, 1)[0];
                    this.variableArea.items.data.splice(event.index, 0, movedItem);
                    this.cdr.markForCheck();
                } else {
                    const sourceAreaComponent = this.resolveSourceAreaComponent(event.sourceAreaId);
                    const sourceArea = sourceAreaComponent?.variableArea ?? (event.item.parent as XoVariableArea);
                    const sourceIndex = sourceArea?.items?.data?.findIndex(item => item.id === event.item.id);
                    if (sourceIndex >= 0) {
                        sourceArea.items.data.splice(sourceIndex, 1);
                        sourceAreaComponent?.markForRefresh();
                    }
                    previewInsert(event.item);
                }
                this.performAction({
                    type: ModellingActionType.move,
                    objectId: event.item.id,
                    request: new XoMoveModellingObjectRequest(
                        undefined,
                        this.variableArea.getTargetIndex(event.sameArea, event.operation === DragType.move, event.index),
                        this.variableArea.id
                    )
                });
            }
        }
    }


    private resolveSourceAreaComponent(sourceAreaId: string): VariableAreaComponent {
        const component = this.componentMappingService.getComponentForId(this.documentModel?.item, sourceAreaId);
        return component instanceof VariableAreaComponent ? component : undefined;
    }


    markForRefresh() {
        this.cdr.markForCheck();
    }


    get variableArea(): XoVariableArea {
        return this.variableAreaInput();
    }


    @HostBinding('attr.kind')
    @Input('xc-variable-area-kind')
    set kind(value: 'input-area' | 'output-area' | 'throws-area') {
        this._kind = value;
    }


    get kind(): 'input-area' | 'output-area' | 'throws-area' {
        return this._kind;
    }
}
