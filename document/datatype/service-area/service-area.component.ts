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
import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { XoDeleteRequest } from '@pmod/xo/delete-request.model';
import { XcIconButtonComponent } from '@zeta/xc';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoDataType } from '../../../xo/data-type.model';
import { XoDynamicMethod } from '../../../xo/dynamic-method.model';
import { XoMemberMethodArea } from '../../../xo/member-method-area.model';
import { XoMethod } from '../../../xo/method.model';
import { XoModellingItem } from '../../../xo/modelling-item.model';
import { XoMoveModellingObjectRequest } from '../../../xo/move-modelling-object-request.model';
import { XoStaticMethod } from '../../../xo/static-method.model';
import { ModRelativeHoverSide } from '../../workflow/shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDraggableDirective } from '../../workflow/shared/drag-and-drop/mod-draggable.directive';
import { ModDragEvent, ModDropAreaDirective, ModDropEvent } from '../../workflow/shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';
import { MemberServiceComponent } from '../member-service/member-service.component';


@Component({
    selector: 'service-area',
    templateUrl: './service-area.component.html',
    styleUrls: ['./service-area.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ModDropAreaDirective, MemberServiceComponent, ModDraggableDirective, XcIconButtonComponent]
})
export class ServiceAreaComponent extends ModellingObjectComponent {

    currentlyDraggedInheritedInstanceMethod: XoDynamicMethod;

    constructor() {
        super();

        // instantiate specific member models such that they aren't pruned for the release build
          
        const dynamicMethod = new XoDynamicMethod();
        const staticMethod = new XoStaticMethod();

        effect(() => this.setModel(this.serviceArea()));
          
    }


    allowItem = (xoFqn: string, xoId?: string): boolean => {
        const allowedType = xoFqn === XoDynamicMethod.fqn.encode().toLowerCase();
        return allowedType && !this.readonly;
    };


    canDrop = (xo: XoModellingItem, event?: ModDragEvent): boolean => {
        const serviceArea = this.serviceArea();
        const serial = event.side === ModRelativeHoverSide.top || event.side === ModRelativeHoverSide.bottom;

        const isInheritedInstanceMethod = (xo as XoMethod).isInheritedInstanceMethod;
        this.currentlyDraggedInheritedInstanceMethod = isInheritedInstanceMethod ? xo as XoDynamicMethod : null;

        const xoFQN = xo.fqn.encode();
        const allowed = serviceArea?.itemTypes.find(allowedItemFQN => allowedItemFQN === xoFQN);
        return isInheritedInstanceMethod && !!allowed && serial;
    };


    dropped(event: ModDropEvent) {
        const serviceArea = this.serviceArea();
        this.performAction({
            objectId: this.currentlyDraggedInheritedInstanceMethod.id,
            type: ModellingActionType.move,
            request: new XoMoveModellingObjectRequest(
                undefined,
                -1, // add at the bottom
                (serviceArea.parent as XoDataType).overriddenMethodsArea.id,
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


    readonly serviceArea = input<XoMemberMethodArea>(null, { alias: 'serviceArea' });
    readonly selectedServiceId = input<string>(undefined, { alias: 'selectedServiceId' });
}
