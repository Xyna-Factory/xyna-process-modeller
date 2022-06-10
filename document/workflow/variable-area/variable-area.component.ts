/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
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
import { XoInsertModellingObjectRequest } from '../../../xo/insert-modelling-object-request.model';
import { XoModellingItem } from '../../../xo/modelling-item.model';
import { XoMoveModellingObjectRequest } from '../../../xo/move-modelling-object-request.model';
import { XoVariableArea } from '../../../xo/variable-area.model';
import { DragType, ModDnDEvent } from '../shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDragEvent, ModDropEvent } from '../shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'variable-area',
    templateUrl: './variable-area.component.html',
    styleUrls: ['./variable-area.component.scss']/*,
    changeDetection: ChangeDetectionStrategy.OnPush*/
})
export class VariableAreaComponent extends ModellingObjectComponent {
    private _kind: 'input-area' | 'output-area' | 'throws-area';

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
        if (moving && !xo.deletable) {
            return false;
        }
        return !this.variableArea.variables.find((variable, index) => index >= hoverEvent.index && !variable.deletable);
    };


    dropped(event: ModDropEvent) {
        // decrease target index when moving the source forward
        if (event.sameArea && event.operation === DragType.move && event.index > event.sourceIndex) {
            event.index--;
        }
        // insert
        if (event.operation === DragType.insert) {
            this.performAction({
                type: ModellingActionType.insert,
                objectId: this.variableArea.id,
                request: new XoInsertModellingObjectRequest(
                    undefined,
                    this.variableArea.getTargetIndex(event.sameArea, false, event.index),
                    event.item.createInsertRequestContent()
                )
            });
        }
        // copy
        else if (event.operation === DragType.copy) {
            this.performAction({
                type: ModellingActionType.copy,
                objectId: event.item.id,
                request: new XoMoveModellingObjectRequest(
                    undefined,
                    this.variableArea.getTargetIndex(event.sameArea, false, event.index),
                    this.variableArea.id
                )
            });
            // preview copy operation by inserting the variable before the request is done
            this.variableArea.items.data.splice(event.index, 0, event.item);
        }
        // move
        else if (event.operation === DragType.move) {
            // target index must be different from source index, if inserting into the same area
            if (!event.sameArea || event.sourceIndex !== event.index) {
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


    @Input()
    set variableArea(value: XoVariableArea) {
        this.setModel(value);
    }


    get variableArea(): XoVariableArea {
        return this.getModel() as XoVariableArea;
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
