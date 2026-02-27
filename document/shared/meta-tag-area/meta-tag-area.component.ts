/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { ChangeDetectorRef, Component, inject, Input } from '@angular/core';

import { ModellingActionType } from '@pmod/api/xmom.service';
import { DragType } from '@pmod/document/workflow/shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDropEvent } from '@pmod/document/workflow/shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent } from '@pmod/document/workflow/shared/modelling-object.component';
import { XoInsertModellingObjectRequest } from '@pmod/xo/insert-modelling-object-request.model';
import { XoMetaTagArea } from '@pmod/xo/meta-tag-area.model';
import { XoMetaTag } from '@pmod/xo/meta-tag.model';
import { XoMoveModellingObjectRequest } from '@pmod/xo/move-modelling-object-request.model';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../zeta/i18n/i18n.module';
import { ModDropAreaDirective } from '../../workflow/shared/drag-and-drop/mod-drop-area.directive';
import { MetaTagComponent } from '../meta-tag/meta-tag.component';
import { ModDraggableDirective } from '../../workflow/shared/drag-and-drop/mod-draggable.directive';


@Component({
    selector: 'meta-tag-area',
    templateUrl: './meta-tag-area.component.html',
    styleUrl: './meta-tag-area.component.scss',
    imports: [XcModule, I18nModule, ModDropAreaDirective, MetaTagComponent, ModDraggableDirective]
})
export class MetaTagAreaComponent extends ModellingObjectComponent {

    private readonly cdr: ChangeDetectorRef = inject<ChangeDetectorRef>(ChangeDetectorRef);

    get metaTagArea(): XoMetaTagArea {
        return this.getModel() as XoMetaTagArea;
    }

    @Input()
    set metaTagArea(value: XoMetaTagArea) {
        this.setModel(value);
    }

    @Input()
    objectIdKey = '';

    @Input()
    objectId = '';

    newTag: string;

    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    addMetaTag() {
        const metaTag: XoMetaTag = new XoMetaTag();
        metaTag.tag = this.newTag;
        const request: XoInsertModellingObjectRequest = new XoInsertModellingObjectRequest();
        request.index = -1;
        request.content = metaTag.createInsertRequestContent();
        this.performAction({
            type: ModellingActionType.insert,
            objectId: this.metaTagArea.id,
            request: request
        });
    }

    moveMetaTag(metaTag: XoMetaTag, index: number) {
        this.performAction({
            type: ModellingActionType.move,
            objectId: metaTag.id,
            request: new XoMoveModellingObjectRequest(undefined, index, this.metaTagArea.id)
        });
    }

    // drag and drop

    allowItem = (xoFqn: string, xoId?: string): boolean => {
        const allowedType = !!this.metaTagArea.itemTypes.find((itemType: string) => itemType.toLowerCase() === xoFqn.toLowerCase());
        return allowedType && !this.readonly;
    }

    dropped(event: ModDropEvent<XoMetaTag>) {
        if (event.operation === DragType.move || event.operation === DragType.copy) {
            if (!(event.sameArea && event.sourceIndex === event.index)) {
                let index: number = event.index;
                if (event.sameArea && event.operation === DragType.move && event.index > event.sourceIndex) {
                    index--;
                }
                index = index >= this.metaTagArea.items.length - 1 ? -1 : index;

                this.moveMetaTag(event.item, index);
            }
        }
    }
}
