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
import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';

import { DRAG_CSS_CLASSES, DragType, Draggable, ModDnDEventConvert, ModDragAndDropService, ModDragDataInfo, ModDragDataTransferKey } from './mod-drag-and-drop.service';


@Directive({
    selector: '[mod-draggable]'
})
export class ModDraggableDirective implements OnInit {

    @Input('mod-draggable')
    data: Draggable;

    @Input('mod-draggable-allowed-drag-type')
    allowedDragType = DragType.move;


    constructor(private readonly elementRef: ElementRef, private readonly dndService: ModDragAndDropService) {
    }


    ngOnInit(): void {
        this.elementRef.nativeElement.draggable = 'true';

        // don't listen to selectstart because this would cause problems with inputs and contenteditables inside draggable elements
        // see https://github.com/react-dnd/react-dnd/issues/178
        this.elementRef.nativeElement.addEventListener('selectstart', (event: Event) => {
            event.stopImmediatePropagation();
        });
    }


    @HostListener('dragstart', ['$event'])
    dragStart(event: Event) {
        const dragEvent = ModDnDEventConvert(event);
        dragEvent.stopPropagation();

        dragEvent.dataTransfer.effectAllowed = this.allowedDragType === DragType.move ? 'copyMove' : 'copy';
        this.elementRef.nativeElement.classList.add(DRAG_CSS_CLASSES.PLACEHOLDER_SOURCE);


        // find parent area and index
        const parent = this.elementRef.nativeElement.parentElement;
        let index = 0;
        for (; index < parent.children.length; index++) {
            if (parent.children[index] === this.elementRef.nativeElement) {
                break;
            }
        }

        // attach drag data
        if (this.data) {
            const jsonData: ModDragDataInfo = {
                fromAreaId: parent.id,
                fromIndex: index,
                allowedDragType: this.allowedDragType
            };
            this.dndService.setTransferredData(dragEvent, ModDragDataTransferKey.info, JSON.stringify(jsonData));
            this.dndService.setTransferredData(dragEvent, ModDragDataTransferKey.fqn, this.data.fqn.encode());
            this.dndService.setTransferredData(dragEvent, ModDragDataTransferKey.id, (this.data.id ? this.data.id : ''));
            this.dndService.setTransferredData(dragEvent, ModDragDataTransferKey.serverId, this.dndService.serverId);
            this.dndService.setTransferredData(dragEvent, ModDragDataTransferKey.clientId, this.dndService.clientId);

            this.dndService.setDraggedItem(dragEvent, this.data);
        }
    }


    @HostListener('dragend', ['$event'])
    dragEnd(event: Event) {
        const dragEvent = ModDnDEventConvert(event);
        dragEvent.preventDefault();
        this.elementRef.nativeElement.classList.remove(DRAG_CSS_CLASSES.PLACEHOLDER_SOURCE);
        this.dndService.clearHoverState();
        this.dndService.setDraggedItem(dragEvent, null);
    }
}
