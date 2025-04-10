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
import { ChangeDetectorRef, Component, ElementRef, inject, Injector, Input, Optional } from '@angular/core';

import { ModellingActionType } from '@pmod/api/xmom.service';
import { ComponentMappingService } from '@pmod/document/component-mapping.service';
import { DocumentService } from '@pmod/document/document.service';
import { ModellingObjectComponent } from '@pmod/document/workflow/shared/modelling-object.component';
import { XoMetaTagArea } from '@pmod/xo/meta-tag-area.model';
import { XoMetaTagRequest } from '@pmod/xo/meta-tag-request.model';
import { XoMetaTag } from '@pmod/xo/meta-tag.model';

import { WorkflowDetailLevelService } from '../../workflow-detail-level.service';
import { ModDropEvent } from '@pmod/document/workflow/shared/drag-and-drop/mod-drop-area.directive';
import { XoMoveModellingObjectRequest } from '@pmod/xo/move-modelling-object-request.model';
import { DragType } from '@pmod/document/workflow/shared/drag-and-drop/mod-drag-and-drop.service';


@Component({
    selector: 'meta-tag-area',
    templateUrl: './meta-tag-area.component.html',
    styleUrl: './meta-tag-area.component.scss',
    standalone: false
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

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
    }

    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    addMetaTag() {
        const metaTag: XoMetaTag = new XoMetaTag();
        metaTag.tag = this.newTag;
        const request: XoMetaTagRequest = new XoMetaTagRequest();
        request.metaTag = metaTag;
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
        //return xoFqn.toLowerCase() === XoMetaTag.fqn.encode().toLowerCase()
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
