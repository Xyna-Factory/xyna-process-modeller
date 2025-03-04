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
import { Directive, ElementRef, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';

import { coerceBoolean } from '@zeta/base';
import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { DRAG_CSS_CLASSES, DragType, ModDnDEvent, ModDnDEventConvert, ModDragAndDropService, ModDragDataInfo, ModDragDataTransferKey, ModRelativeHoverSide, ModRelativeHoverSideCalculate, ModRelativeHoverSideFlip, Distance, Draggable } from './mod-drag-and-drop.service';




export interface ModDragEvent {
    /** new index of element when dropped */
    index: number;
    /** side of the target the dragged item would be dropped */
    side: ModRelativeHoverSide;
    /** fraction [0..1] in x direction relative to the hovered element */
    s: number;
    /** fraction [0..1] in y direction relative to the hovered element */
    t: number;
    /** index of element under the cursor */
    indexUnderCursor?: number;
}


export interface ModDropEvent<T = Draggable> extends ModDragEvent {
    item: T;
    sourceIndex: number;
    operation: DragType;
    sameArea: boolean;
}


@Directive({
    selector: '[mod-drop-area]',
    standalone: false
})
export class ModDropAreaDirective implements OnInit, OnDestroy {

    @Input('mod-drop-area')
    items: { id: string }[];

    private areaElement: Element;

    /**
     * Is called once when entering the area
     */
    @Input('mod-drop-area-allow-item')
    allowItem?: (xoFqn: string, xoId?: string) => boolean;

    /**
     * Is called on dragover to decide, if an item can be dropped at a specific position. So don't do expensive operations here
     */
    @Input('mod-drop-area-can-drop')
    canDrop?: (draggable: Draggable, hoverEvent?: ModDragEvent, dragEvent?: ModDnDEvent) => boolean;

    /**
     * Is called every time before the drop indicator is rendered
     *
     * Can be used to manipulate the data of *ModDragEvent* for a different behavior of the drop indicator
     *
     * @returns Indentation of indicator in pixels. Modifying the passed event will also affect the indicator's behavior
     */
    @Input('mod-drop-area-update-indicator')
    updateIndicator?: (dragEvent: ModDragEvent) => Distance;

    @Input('mod-drop-area-direction')
    direction: 'horizontal' | 'vertical' = 'vertical';

    /**
     * Defines if parallel (locationally) inserts are allowed
     */
    @Input('mod-drop-area-allow-parallel')
    parallel = false;

    private _hideIndicator = false;
    /**
     * Defines if default drop indicator shall be hidden
     */
    @Input('mod-drop-area-hide-indicator')
    set hideIndicator(value: boolean) {
        this._hideIndicator = coerceBoolean(value);
    }

    get hideIndicator(): boolean {
        return this._hideIndicator;
    }

    @Output('mod-drop-area-dropped')
    readonly dropped = new EventEmitter<ModDropEvent>();

    private dragOverHandler: (event: Event) => void;
    private dragEnterHandler: (event: Event) => void;
    private dragLeaveHandler: (event: Event) => void;

    private readonly subscriptions = new Array<Subscription>();


    constructor(
        readonly elementRef: ElementRef,
        private readonly dndService: ModDragAndDropService,
        private readonly dialogService: XcDialogService,
        private readonly i18n: I18nService,
        private readonly zone: NgZone
    ) {
        this.subscriptions.push(
            this.dndService.currentAreaChange.pipe(filter(area => area === this.areaElement)).subscribe(area => {
                zone.runOutsideAngular(() => area.addEventListener('dragover', this.dragOverHandler, false));
                area.classList.add(DRAG_CSS_CLASSES.AREA_HOVER);
            }),
            this.dndService.leftArea.pipe(filter(area => area === this.areaElement)).subscribe(area => {
                zone.runOutsideAngular(() => area.removeEventListener('dragover', this.dragOverHandler));
                area.classList.remove(DRAG_CSS_CLASSES.AREA_HOVER);
                this.dndService.hideDropIndicator();
            })
        );
    }


    ngOnInit() {
        this.areaElement = this.elementRef.nativeElement;

        // drag'n'drop-mechanism shall run outside Angulars monkey-patching because
        // 1. these events don't affect other components and
        // 2. it saves performance
        this.zone.runOutsideAngular(() => {
            this.dragEnterHandler = this.dragEnter.bind(this);
            this.dragLeaveHandler = this.dragLeave.bind(this);
            this.dragOverHandler = this.dragOver.bind(this);

            this.areaElement.addEventListener('dragenter', this.dragEnterHandler, false);
            this.areaElement.addEventListener('dragleave', this.dragLeaveHandler, false);
            // 'dragover' is only bound for the top-most area
        });
    }


    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.areaElement?.removeEventListener('dragenter', this.dragEnterHandler);
        this.areaElement?.removeEventListener('dragleave', this.dragLeaveHandler);
    }


    private dragEnter(event: Event) {
        const dragEvent = ModDnDEventConvert(event);
        const xoFqn = this.dndService.getTransferredData(dragEvent, ModDragDataTransferKey.fqn);
        const xoId = this.dndService.getTransferredData(dragEvent, ModDragDataTransferKey.id);
        if (this.allowItem?.(xoFqn, xoId)) {
            this.dndService.enterArea(this.areaElement);
        }
    }


    private dragLeave() {
        this.dndService.leaveArea(this.areaElement);
    }


    /**
     * Listens to drag-changes on the currently hovered area and displays drop indicator.
     *
     * Shall only be called for the top-most area, that is currently hovered
     */
    private dragOver(event: Event) {
        if (this.dndService.currentArea === this.areaElement) {
            const dragEvent = ModDnDEventConvert(event);
            event.preventDefault();
            dragEvent.dataTransfer.dropEffect = dragEvent.ctrlKey || dragEvent.dataTransfer.effectAllowed === 'copy' ? 'copy' : 'move';

            // render drop indicator
            const hoverInfo = this.evaluateHoverInfo(dragEvent);
            if (hoverInfo.index !== undefined) {
                if (!this.canDrop || this.canDrop(this.dndService.getDraggedItem(dragEvent), hoverInfo, dragEvent)) {
                    if (hoverInfo.index >= this.areaElement.children.length) {
                        // take previous child and flip side
                        hoverInfo.index--;
                        hoverInfo.side = ModRelativeHoverSideFlip(hoverInfo.side);
                    }

                    // retrieve specific indentation of drop indicator for hovered element
                    const indentation = this.updateIndicator?.(hoverInfo);

                    const areaChild = this.areaElement.children[hoverInfo.index];
                    const draggedId = this.dndService.getTransferredData(dragEvent, ModDragDataTransferKey.id);
                    const hoveredChild = this.items && this.items.length > hoverInfo.index ? this.items[hoverInfo.index] : null;
                    const hoveredId = hoveredChild ? hoveredChild.id : null;

                    if (!this.hideIndicator && areaChild && (draggedId !== hoveredId || dragEvent.dataTransfer.dropEffect !== 'move')) {
                        // hovered areaChild is not currently dragged element
                        this.dndService.showDropIndicator(areaChild, hoverInfo.side, indentation);
                    } else {
                        this.dndService.hideDropIndicator();
                    }
                } else {
                    dragEvent.dataTransfer.dropEffect = 'none';
                }
            }
        }
    }


    @HostListener('drop', ['$event'])
    drop(event: Event) {
        if (this.dndService.currentArea === this.areaElement) {
            const dragEvent = ModDnDEventConvert(event);
            this.areaElement.classList.remove(DRAG_CSS_CLASSES.AREA_HOVER);
            this.dndService.hideDropIndicator();
            // check, if drag source is the same
            const clientId = this.dndService.getTransferredData(dragEvent, ModDragDataTransferKey.clientId);
            if (clientId !== this.dndService.clientId) {
                const serverId = this.dndService.getTransferredData(dragEvent, ModDragDataTransferKey.serverId);
                const title = this.i18n.translate('pmod.workflow.dnd.unsupported-title');
                if (serverId !== this.dndService.serverId) {
                    this.dialogService.info(title, this.i18n.translate('pmod.workflow.dnd.unsupported-server-message'));
                } else {
                    this.dialogService.info(title, this.i18n.translate('pmod.workflow.dnd.unsupported-client-message'));
                }
            } else {
                const hoverInfo = this.evaluateHoverInfo(dragEvent);
                const infoJSON = this.dndService.getTransferredData(dragEvent, ModDragDataTransferKey.info);
                const info: ModDragDataInfo = JSON.parse(infoJSON);
                const draggable = this.dndService.getDraggedItem(dragEvent);
                if (info && draggable && (!this.canDrop || this.canDrop && this.canDrop(draggable, hoverInfo, dragEvent))) {
                    let operation = info.allowedDragType;
                    if (operation === DragType.move && (!this.dndService.thisStartedDragging || dragEvent.ctrlKey || dragEvent.altKey)) {
                        operation = DragType.copy;
                    }
                    this.dropped.emit({
                        item: draggable,
                        sourceIndex: info.fromIndex,
                        operation: operation,
                        sameArea: info.fromAreaId === this.areaElement.id,
                        index: hoverInfo.index,
                        indexUnderCursor: hoverInfo.indexUnderCursor,
                        side: hoverInfo.side,
                        s: hoverInfo.s,
                        t: hoverInfo.t
                    });
                }
            }
        }
    }


    /**
     * Calculates drop position and hover indicator side
     * @returns
     *   @param index Position in list, the element is hovering (for the end of the list, index == list.length)
     *   @param side Relative side of the hovered element (e.g. relevant for parallel inserts)
     */
    private evaluateHoverInfo(event: Event & ModDnDEvent): ModDragEvent {
        let dropIndex = 0;
        let side: ModRelativeHoverSide;
        let childIndex = -1;

        let rect: ClientRect | DOMRect;
        let areaChild: Element;

        if (event.target !== this.areaElement) {
            // Hovering a child of the area: Find direct child of the drop-area
            // ----------------------------------------------------------------
            areaChild = this.getChildOfArea(event.target as Element, this.areaElement);
            rect = areaChild.getBoundingClientRect();

            // find index of area-child
            for (let i = 0; i < this.areaElement.children.length; i++) {
                if (areaChild === this.areaElement.children[i]) {
                    childIndex = i;
                    break;
                }
            }
        } else {
            // Hovering the drop-area itself: Find nearest child (depending on flow-direction)
            // -------------------------------------------------------------------------------------
            let minDistance = Number.MAX_VALUE;
            for (let i = this.areaElement.children.length - 1; i >= 0; i--) {
                const child = this.areaElement.children[i];
                const childRect = child.getBoundingClientRect();
                const distance = this.getDistance(event.clientX, event.clientY, childRect);
                const dimensionDistance = this.direction === 'vertical' ? distance.dy : distance.dx;
                if (dimensionDistance < minDistance) {
                    minDistance = dimensionDistance;
                    rect = childRect;
                    childIndex = i;
                }
            }
            if (!rect) {
                // for empty areas
                rect = new DOMRect(0, 0, 0, 0);
            }
        }

        /*
         * Calculate, on which side of the child the dragged item would be dropped.
         * Always show indicator on the left (or top) of the element (except for the end of the list)
         */
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        if (this.direction === 'horizontal') {
            const hoverSide = ModRelativeHoverSideCalculate(localX, localY, rect, true, this.parallel);
            if (hoverSide === ModRelativeHoverSide.right) {
                dropIndex = childIndex + 1;
                side = ModRelativeHoverSide.left;
            } else {
                dropIndex = childIndex;
                side = hoverSide;
            }
        } else if (this.direction === 'vertical') {
            const hoverSide = ModRelativeHoverSideCalculate(localX, localY, rect, this.parallel, true);
            if (hoverSide === ModRelativeHoverSide.bottom) {
                dropIndex = childIndex + 1;
                side = ModRelativeHoverSide.top;
            } else {
                dropIndex = childIndex;
                side = hoverSide;
            }
        }

        /*
        If areaChild is set, it's the element under the cursor. If not, childIndex is set but it's just the last element.
        In that case, indexUnderCursor should be -1.
        s should cover the full range of [0..1] for EACH element under the cursor.
        */
        return {
            index: dropIndex,
            indexUnderCursor: areaChild ? childIndex : -1,
            side: side,
            s: (((event as DragEvent).offsetX ?? 0) - (areaChild?.clientLeft ?? 0)) / (areaChild?.clientWidth ?? 1),
            t: (((event as DragEvent).offsetY ?? 0) - (areaChild?.clientTop ?? 0)) / (areaChild?.clientHeight ?? 1)
        };
    }


    /**
     * Returns a direct child of area, where direct child is a parent* of deepChild
     */
    private getChildOfArea(deepChild: Element, area: Element): Element {
        let areaChild = deepChild;
        while (areaChild && areaChild.parentElement !== area) {
            areaChild = areaChild.parentElement;
        }
        return areaChild;
    }


    /**
     * Calculates Manhattan distance
     */
    private getDistance(x: number, y: number, rect: ClientRect | DOMRect): Distance {
        let dx: number;
        if (x < rect.left) {
            dx = rect.left - x;
        } else if (x < rect.left + rect.width) {
            dx = 0;
        } else {
            dx = x - rect.left - rect.width;
        }

        let dy: number;
        if (y < rect.top) {
            dy = rect.top - y;
        } else if (y < rect.top + rect.height) {
            dy = 0;
        } else {
            dy = y - rect.top - rect.height;
        }

        return { dx: dx, dy: dy };
    }
}
