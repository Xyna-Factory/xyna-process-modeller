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
import { Component, ElementRef, Injector, Input, Optional } from '@angular/core';

import { XoDeleteRequest } from '@pmod/xo/delete-request.model';

import { ModellingActionType } from '../../../api/xmom.service';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoDataType } from '../../../xo/data-type.model';
import { XoDynamicMethod } from '../../../xo/dynamic-method.model';
import { XoMemberMethodArea } from '../../../xo/member-method-area.model';
import { XoMethod } from '../../../xo/method.model';
import { XoModellingItem } from '../../../xo/modelling-item.model';
import { XoMoveModellingObjectRequest } from '../../../xo/move-modelling-object-request.model';
import { XoStaticMethod } from '../../../xo/static-method.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModRelativeHoverSide } from '../../workflow/shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDragEvent, ModDropEvent } from '../../workflow/shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';


@Component({
    selector: 'service-area',
    templateUrl: './service-area.component.html',
    styleUrls: ['./service-area.component.scss']
})
export class ServiceAreaComponent extends ModellingObjectComponent {

    currentlyDraggedInheritedInstanceMethod: XoDynamicMethod;

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        // instantiate specific member models such that they aren't pruned for the release build
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const dynamicMethod = new XoDynamicMethod();
        const staticMethod = new XoStaticMethod();
        /* eslint-enable @typescript-eslint/no-unused-vars */
    }


    allowItem = (xoFqn: string, xoId?: string): boolean => {
        const allowedType = xoFqn === XoDynamicMethod.fqn.encode().toLowerCase();
        return allowedType && !this.readonly;
    };


    canDrop = (xo: XoModellingItem, event?: ModDragEvent): boolean => {
        const serial = event.side === ModRelativeHoverSide.top || event.side === ModRelativeHoverSide.bottom;

        const isInheritedInstanceMethod = (xo as XoMethod).isInheritedInstanceMethod;
        this.currentlyDraggedInheritedInstanceMethod = isInheritedInstanceMethod ? xo as XoDynamicMethod : null;

        const xoFQN = xo.fqn.encode();
        const allowed = this.serviceArea.itemTypes.find(allowedItemFQN => allowedItemFQN === xoFQN);
        return isInheritedInstanceMethod && !!allowed && serial;
    };


    dropped(event: ModDropEvent) {
        this.performAction({
            objectId: this.currentlyDraggedInheritedInstanceMethod.id,
            type: ModellingActionType.move,
            request: new XoMoveModellingObjectRequest(
                undefined,
                -1, // add at the bottom
                (this.serviceArea.parent as XoDataType).overriddenMethodsArea.id,
                ModRelativeHoverSide.inside
            )
        });
    }


    deleteService(service: XoMethod) {
        if (service.deletable) {
            if (!this.readonly) {
                this.performAction({
                    type: ModellingActionType.delete,
                    objectId: service.id,
                    request: new XoDeleteRequest()
                });
            }
        }
    }


    @Input()
    set serviceArea(value: XoMemberMethodArea) {
        this.setModel(value);
    }


    get serviceArea(): XoMemberMethodArea {
        return this.getModel() as XoMemberMethodArea;
    }
}
