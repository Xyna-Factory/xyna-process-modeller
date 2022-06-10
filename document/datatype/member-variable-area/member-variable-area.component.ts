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
import { Component, ElementRef, Injector, Input, Optional } from '@angular/core';

import { ModellingActionType } from '../../../api/xmom.service';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoDataMemberVariable } from '../../../xo/data-member-variable.model';
import { XoDeleteRequest } from '../../../xo/delete-request.model';
import { XoInsertModellingObjectRequest } from '../../../xo/insert-modelling-object-request.model';
import { XoMemberVariableArea } from '../../../xo/member-variable-area.model';
import { XoMoveModellingObjectRequest } from '../../../xo/move-modelling-object-request.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { DragType } from '../../workflow/shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDropEvent } from '../../workflow/shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';


@Component({
    selector: 'member-variable-area',
    templateUrl: './member-variable-area.component.html',
    styleUrls: ['./member-variable-area.component.scss']
})
export class MemberVariableAreaComponent extends ModellingObjectComponent {

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const antiTreeShakingInstance = new XoDataMemberVariable();
    }


    allowItem = (xoFqn: string): boolean => {
        const allowedType = !!this.memberVariableArea.itemTypes.find((itemType: string) => itemType.toLowerCase() === xoFqn.toLowerCase());
        return allowedType && !this.readonly;
    };


    deleteVarable(variable: XoDataMemberVariable) {
        if (variable.deletable) {
            if (!this.readonly) {
                this.performAction({
                    type: ModellingActionType.delete,
                    objectId: variable.id,
                    request: new XoDeleteRequest()
                });
            }
        }
    }


    dropped(event: ModDropEvent) {
        // decrease target index when moving the source forward
        if (event.sameArea && event.index > event.sourceIndex) {
            event.index--;
        }

        const index = this.memberVariableArea.getTargetIndex(event.sameArea, event.operation === DragType.move, event.index);

        if (event.operation === DragType.move || event.operation === DragType.copy) {
            if (!(event.operation === DragType.move && event.sameArea && event.sourceIndex === event.index)) {         // only move if something changed
                this.memberVariableArea.items.data.splice(event.index, 0, event.item);
                this.performAction({
                    objectId: event.item.id,
                    type: event.operation === 'move' ? ModellingActionType.move : ModellingActionType.copy,
                    request: new XoMoveModellingObjectRequest(undefined, index, this.memberVariableArea.id)
                });
            }
        } else if (event.operation === DragType.insert) {
            const request = new XoInsertModellingObjectRequest(undefined, index);
            request.content = event.item.createInsertRequestContent();
            request.content.type = 'memberVar'; // siehe PMOD-406
            this.performAction({ type: ModellingActionType.insert, objectId: this.memberVariableArea.id, request: request });
        }
    }


    @Input()
    set memberVariableArea(value: XoMemberVariableArea) {
        this.setModel(value);
    }


    get memberVariableArea(): XoMemberVariableArea {
        return this.getModel() as XoMemberVariableArea;
    }
}
