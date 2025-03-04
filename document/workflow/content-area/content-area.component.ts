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
import { Component, HostBinding, Input } from '@angular/core';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoContentArea } from '../../../xo/content-area.model';
import { XoInsertModellingObjectRequest } from '../../../xo/insert-modelling-object-request.model';
import { XoModellingItem } from '../../../xo/modelling-item.model';
import { XoMoveModellingObjectRequest } from '../../../xo/move-modelling-object-request.model';
import { DragType, ModRelativeHoverSide, ModRelativeHoverSideFlip } from '../shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDragEvent, ModDropEvent } from '../shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'content-area',
    templateUrl: './content-area.component.html',
    styleUrls: ['./content-area.component.scss'],
    standalone: false
})
export class ContentAreaComponent extends ModellingObjectComponent {
    private _direction: 'row' | 'column' = 'column';


    allowItem = (xoFqn: string, xoId?: string): boolean => {
        const allowedType = !!this.contentArea.itemTypes.find((itemType: string) => xoFqn && itemType.toLowerCase() === xoFqn.toLowerCase());
        return allowedType && !this.readonly;
    };


    canDrop = (xo: XoModellingItem, event?: ModDragEvent): boolean => {
        const serial = event.side === ModRelativeHoverSide.top || event.side === ModRelativeHoverSide.bottom;
        /** @todo also check predecessor-step */

        // check if xo allows a successor
        if (serial && xo && !xo.isSuccessorAllowed() && event.index < this.contentArea.items.length) {
            // if xo does not allow a successor, xo has to be the last item
            return false;
        }

        // check step before allows successor
        if (serial && this.contentArea.items.length > 0) {
            const stepBefore = event.index > 0 ? this.contentArea.items.data[event.index - 1] as XoModellingItem : null;
            if (stepBefore && !stepBefore.isSuccessorAllowed()) {
                return false;
            }
        }
        return true;
    };


    dropped(event: ModDropEvent<XoModellingItem>) {
        const newContainerSize = event.sameArea && event.operation === DragType.move ? this.contentArea.items.length : this.contentArea.items.length + 1;

        let hoveredStepId: string;
        let relativePosition: ModRelativeHoverSide;
        const parallel = event.side === ModRelativeHoverSide.left || event.side === ModRelativeHoverSide.right;
        if (parallel) {
            // if inserting at the end of a horizontal list -> choose last element and flip side
            const hoveredStepIndex = Math.min(event.index, this.contentArea.items.length - 1);   // don't use recalculated index here
            hoveredStepId = this.contentArea.items.data[hoveredStepIndex].id;
            relativePosition = event.index >= this.contentArea.items.length ? ModRelativeHoverSideFlip(event.side) : event.side;
        }

        if (event.operation === DragType.move || event.operation === DragType.copy) {
            if (!(event.operation === DragType.move && event.sameArea && event.sourceIndex === event.index)) {         // only move if something changed
                // if item is moved to a higher index, the insert index has to be decreased, because the item vanishes from its source index
                let index = event.index;
                if (event.sameArea && event.operation === DragType.move && event.index > event.sourceIndex) {
                    index--;
                }
                const request = new XoMoveModellingObjectRequest();
                if (parallel) {
                    request.targetId = hoveredStepId;
                    request.relativePosition = relativePosition;
                } else {
                    request.targetId = this.contentArea.id;
                    request.index = index >= newContainerSize - 1 ? -1 : index;
                    request.relativePosition = ModRelativeHoverSide.inside;
                }
                this.performAction({ type: event.operation === 'move' ? ModellingActionType.move : ModellingActionType.copy, objectId: event.item.id, request: request });
            }
        } else if (event.operation === DragType.insert) {
            const request = new XoInsertModellingObjectRequest();
            if (parallel) {
                request.relativePosition = relativePosition;
            } else {
                request.index = event.index >= newContainerSize - 1 ? -1 : event.index;
                request.relativePosition = ModRelativeHoverSide.inside;
            }
            request.content = event.item.createInsertRequestContent();
            this.performAction({ type: ModellingActionType.insert, objectId: parallel ? hoveredStepId : this.contentArea.id, request: request });
        }
    }


    @Input()
    set contentArea(value: XoContentArea) {
        this.setModel(value);
    }


    get contentArea(): XoContentArea {
        return this.getModel() as XoContentArea;
    }


    @HostBinding('attr.direction')
    @Input('xc-content-area-direction')
    set direction(value: 'row' | 'column') {
        this._direction = value;
    }


    get direction(): 'row' | 'column' {
        return this._direction;
    }
}
