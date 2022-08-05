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
import { Injectable } from '@angular/core';

import { XoCase } from '@pmod/xo/case.model';
import { XoDataMemberVariable } from '@pmod/xo/data-member-variable.model';
import { XoJson } from '@zeta/api';
import { AuthService } from '@zeta/auth';
import { randomUUID } from '@zeta/base';

import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { XoBranch } from '../../../../xo/branch.model';
import { XoConditionalBranching } from '../../../../xo/conditional-branching.model';
import { XoConditionalChoice } from '../../../../xo/conditional-choice.model';
import { XoData } from '../../../../xo/data.model';
import { XoDynamicMethodInvocation } from '../../../../xo/dynamic-method-invocation.model';
import { XoDynamicMethod } from '../../../../xo/dynamic-method.model';
import { XoException } from '../../../../xo/exception.model';
import { XoForeach } from '../../../../xo/foreach.model';
import { XoInvocation } from '../../../../xo/invocation.model';
import { XoMapping } from '../../../../xo/mapping.model';
import { XoModellingItem } from '../../../../xo/modelling-item.model';
import { XoParallelism } from '../../../../xo/parallelism.model';
import { XoQuery } from '../../../../xo/query.model';
import { XoRetry } from '../../../../xo/retry.model';
import { XoStaticMethodInvocation } from '../../../../xo/static-method-invocation.model';
import { XoStaticMethod } from '../../../../xo/static-method.model';
import { XoTemplate } from '../../../../xo/template.model';
import { XoThrow } from '../../../../xo/throw.model';
import { XoTypeChoice } from '../../../../xo/type-choice.model';
import { XoWorkflowInvocation } from '../../../../xo/workflow-invocation.model';


export const DRAG_CSS_CLASSES = {
    PLACEHOLDER_SOURCE: 'mod-draggable-placeholder-source',
    PLACEHOLDER_ALLOWED: 'mod-draggable-placeholder-allowed',
    AREA_HOVER: 'mod-drop-area-hover'
};


interface HoveredArea {
    area: Element;
    enterCount: number;
}


interface XoEncoding {
    fqn: string;
    data: XoJson;
}


export interface Distance {
    dx: number;
    dy: number;
}


export enum ModRelativeHoverSide {
    top = 'top',
    right = 'right',
    bottom = 'bottom',
    left = 'left',
    inside = 'inside'
}

export function ModRelativeHoverSideCalculate(x: number, y: number, rect: ClientRect, horizontal: boolean, vertical: boolean): ModRelativeHoverSide {
    if (horizontal && !vertical) {
        return x < rect.width / 2 ? ModRelativeHoverSide.left : ModRelativeHoverSide.right;
    }
    if (!horizontal && vertical) {
        return y < rect.height / 2 ? ModRelativeHoverSide.top : ModRelativeHoverSide.bottom;
    }
    if (horizontal && vertical) {
        const normX = x / rect.width;
        const normY = y / rect.height;
        const leftTopArea = normX + normY < 1;
        const rightTopArea = (1 - normX) + normY < 1;
        if (leftTopArea) {
            return rightTopArea ? ModRelativeHoverSide.top : ModRelativeHoverSide.left;
        }
        return rightTopArea ? ModRelativeHoverSide.right : ModRelativeHoverSide.bottom;
    }
}

export function ModRelativeHoverSideFlip(side: ModRelativeHoverSide): ModRelativeHoverSide {
    if (side === ModRelativeHoverSide.top) {
        return ModRelativeHoverSide.bottom;
    }
    if (side === ModRelativeHoverSide.right) {
        return ModRelativeHoverSide.left;
    }
    if (side === ModRelativeHoverSide.bottom) {
        return ModRelativeHoverSide.top;
    }
    if (side === ModRelativeHoverSide.left) {
        return ModRelativeHoverSide.right;
    }
    return ModRelativeHoverSide.inside;
}


export enum DragType {
    move = 'move',
    copy = 'copy',
    insert = 'insert'
}


export interface ModDragDataInfo {
    fromAreaId: string;
    fromIndex: number;
    allowedDragType: DragType;
}


export enum ModDragDataTransferKey {
    xo = 'text/plain',
    info = 'info',
    fqn = 'fqn#',
    id = 'id#',
    serverId = 'sid#',
    clientId = 'cid#'
}


export interface ModDnDEvent {
    dataTransfer: any;
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    altKey: boolean;
}


export function ModDnDEventConvert(event: Event | any): Event & ModDnDEvent {
    return event;
}



/**
Algorithm for nested drop areas:

    stack with currently hovered areas ordered top-down

    enter: inside ? inc count : add onto stack at correct position
    leave: dec count; count == 0 => remove from stack
 */
@Injectable()
export class ModDragAndDropService {

    serverId: string;
    clientId: string;

    /**
     * Currently hovered areas ordered top-down
     */
    private areaStack = Array<HoveredArea>();

    private readonly _currentAreaSubject = new Subject<Element>();
    private readonly _leftAreaSubject = new Subject<Element>();

    private dropIndicator: HTMLElement;

    /**
     * Stores currently dragged item, if a drag is in progress which was started inside this app.
     * If an item is dragged from another app, this item will be null. This way one can distinguish between
     * moving and copying the item.
     */
    private _draggedItem: XoModellingItem;

    private _canvas: HTMLCanvasElement;


    constructor(authService: AuthService) {
        authService.sessionInfoChange.pipe(
            filter(sessionInfo => !!sessionInfo)
        ).subscribe(
            sessionInfo => this.serverId = sessionInfo.serverId + ''
        );
        this.clientId = randomUUID();
    }


    enterArea(area: Element) {
        // find area in stack and increase count
        const hoveredArea = this.areaStack.find(item => item.area === area);
        if (hoveredArea) {
            hoveredArea.enterCount++;
        } else {

            // otherwise insert into stack at correct position
            let parent = area.parentNode;
            let insertIndex = -1;
            while (parent && insertIndex < 0) {
                for (let i = 0; i < this.areaStack.length; i++) {
                    if (parent === this.areaStack[i].area) {
                        insertIndex = i;
                        break;
                    }
                }
                parent = parent.parentNode;
            }
            this.insertIntoStack(area, insertIndex);
        }
    }


    leaveArea(area: Element) {
        // find area in stack and decrease count
        const hoveredArea = this.areaStack.find(item => item.area === area);
        if (hoveredArea) {
            hoveredArea.enterCount--;
            if (hoveredArea.enterCount <= 0) {
                this.removeFromStack(area);
            }
        }
    }


    private insertIntoStack(area: Element, index: number) {
        const lastArea = this.currentArea;
        const hoveredArea = { area: area, enterCount: 1 };
        if (index >= 0) {
            this.areaStack.splice(index, 0, hoveredArea);
        } else {
            this.areaStack.push(hoveredArea);
        }
        // current (topmost) area has changed
        if (this.areaStack[0].area !== lastArea) {
            this._leftAreaSubject.next(lastArea);
            this._currentAreaSubject.next(this.currentArea);
        }
    }


    private removeFromStack(area: Element) {
        const index = this.areaStack.findIndex(item => item.area === area);
        this.areaStack.splice(index, 1);

        // current (topmost) area has changed
        if (index === 0) {
            this._leftAreaSubject.next(area);
            this._currentAreaSubject.next(this.currentArea);
        }
    }


    /** Call each time, the DOM changes */
    clearHoverState() {
        const lastArea = this.currentArea;
        this.areaStack = [];
        if (lastArea) {
            this._leftAreaSubject.next(lastArea);
            this._currentAreaSubject.next(null);
        }
    }


    get currentArea(): Element {
        return this.areaStack.length > 0 ? this.areaStack[0].area : null;
    }


    get currentAreaChange(): Observable<Element> {
        return this._currentAreaSubject.asObservable();
    }


    get leftArea(): Observable<Element> {
        return this._leftAreaSubject.asObservable();
    }



    // --- Data Transfer -------------------------------------------------------------

    getTransferredData(event: Event & ModDnDEvent, key: ModDragDataTransferKey): string {
        if (key === ModDragDataTransferKey.xo || key === ModDragDataTransferKey.info) {
            return event.dataTransfer.getData(key);
        }
        // For this property, only the keys of the transferred data are accessible. So the data has been encoded in the keys.
        // Search for the key that starts with key.
        const data = event.dataTransfer.types.find(dataKey => dataKey.startsWith(key));
        return data ? data.substring(key.length) : null;
    }


    setTransferredData(event: Event & ModDnDEvent, key: ModDragDataTransferKey, value: string) {
        if (key === ModDragDataTransferKey.xo || key === ModDragDataTransferKey.info) {
            // encode Xo with its fqn (encode in value, because key does not preserve case)
            event.dataTransfer.setData(key, value);
        } else {
            // Encode further data
            // --------------------------------------------
            // Needed during drag-process but only drop-event carries values with the keys.
            // So encode data inside the keys of dataTransfer.
            event.dataTransfer.setData(key + value, '');
        }
    }


    getDraggedItem(event: Event & ModDnDEvent): XoModellingItem {
        // check if event contains xo (only for drop-event)
        const data = this.getTransferredData(event, ModDragDataTransferKey.xo);

        if (data) {
            const jsonData: XoEncoding = JSON.parse(data);
            return this.createXo(jsonData.fqn, jsonData.data);     // don't use draggedItem from dnd-service here, because for multi-tab-drag, it won't be set
        }
        return this._draggedItem;
    }


    setDraggedItem(event: Event & ModDnDEvent, value: XoModellingItem) {
        // store in transferred data of event but also inside this service, because the event only returns its values during drop
        if (value) {
            const jsonData: XoEncoding = {
                fqn: value.fqn.encode(),
                data: value.encode()
            };
            this.setTransferredData(event, ModDragDataTransferKey.xo, JSON.stringify(jsonData));
        }
        // additionally, store in this service
        this._draggedItem = value;
    }


    /**
     * If an item started to drag from inside this app, this will be true, else false
     */
    get thisStartedDragging(): boolean {
        return !!this._draggedItem;
    }



    // --- Drop Indicator ------------------------------------------------------------

    setDropIndicator(indicator: HTMLElement) {
        this.dropIndicator = indicator;
    }


    /**
     * Show drop indicator at a specific element
     * @param parent Parent element, the indicator shall be shown relative to
     * @param side Side of the parent element, the indicator shall be shown at
     * @param indentation Optional indentation of the indicator in pixels
     */
    showDropIndicator(parent: Element, side: ModRelativeHoverSide, indentation?: Distance) {
        if (this.dropIndicator) {
            if (this.dropIndicator.parentElement !== parent) {
                this.hideDropIndicator();
                parent.appendChild(this.dropIndicator);
            }
            if (this.dropIndicator.classList.value !== side.toString()) {
                if (this.dropIndicator.classList.value) {
                    this.dropIndicator.classList.remove(this.dropIndicator.classList.value);
                }
                this.dropIndicator.classList.add(side.toString());
            }
            if (indentation) {
                this.dropIndicator.style.setProperty('left', `${indentation?.dx ?? 0}px`);
                this.dropIndicator.style.setProperty('top', `${indentation?.dy ?? 0}px`);
            } else {
                this.dropIndicator.style.removeProperty('left');
                this.dropIndicator.style.removeProperty('top');
            }
        }
    }


    hideDropIndicator() {
        if (this.dropIndicator) {
            if (this.dropIndicator.parentElement) {
                this.dropIndicator.parentElement.removeChild(this.dropIndicator);
            }
        }
    }



    // --- Drop Element Factory ------------------------------------------------------

    createXo(fqn: string, jsonData: XoJson): XoModellingItem {
        // use lowercase because case isn't necessarily persisted in drag-dataTransfer
        switch (fqn.toLowerCase()) {
            case XoBranch.fqn.encode().toLowerCase():
                return new XoBranch().decode(jsonData);
            case (XoCase.fqn).encode().toLowerCase():
                return new XoCase().decode(jsonData);
            case (XoConditionalBranching.fqn).encode().toLowerCase():
                return new XoConditionalBranching().decode(jsonData);
            case (XoConditionalChoice.fqn).encode().toLowerCase():
                return new XoConditionalChoice().decode(jsonData);
            case (XoData.fqn).encode().toLowerCase():
                return new XoData().decode(jsonData);
            case (XoDynamicMethodInvocation.fqn).encode().toLowerCase():
                return new XoDynamicMethodInvocation().decode(jsonData);
            case (XoException.fqn).encode().toLowerCase():
                return new XoException().decode(jsonData);
            case (XoForeach.fqn).encode().toLowerCase():
                return new XoForeach().decode(jsonData);
            case (XoInvocation.fqn).encode().toLowerCase():
                return new XoInvocation().decode(jsonData);
            case (XoMapping.fqn).encode().toLowerCase():
                return new XoMapping().decode(jsonData);
            case (XoParallelism.fqn).encode().toLowerCase():
                return new XoParallelism().decode(jsonData);
            case (XoQuery.fqn).encode().toLowerCase():
                return new XoQuery().decode(jsonData);
            case (XoRetry.fqn).encode().toLowerCase():
                return new XoRetry().decode(jsonData);
            case (XoStaticMethodInvocation.fqn).encode().toLowerCase():
                return new XoStaticMethodInvocation().decode(jsonData);
            case (XoTemplate.fqn).encode().toLowerCase():
                return new XoTemplate().decode(jsonData);
            case (XoThrow.fqn).encode().toLowerCase():
                return new XoThrow().decode(jsonData);
            case (XoTypeChoice.fqn).encode().toLowerCase():
                return new XoTypeChoice().decode(jsonData);
            case (XoWorkflowInvocation.fqn).encode().toLowerCase():
                return new XoWorkflowInvocation().decode(jsonData);
            case (XoDynamicMethod.fqn).encode().toLowerCase():
                return new XoDynamicMethod().decode(jsonData);
            case (XoStaticMethod.fqn).encode().toLowerCase():
                return new XoStaticMethod().decode(jsonData);
            case (XoDataMemberVariable.fqn).encode().toLowerCase():
                return new XoDataMemberVariable().decode(jsonData);
            default: console.warn('type not found for', fqn);
                return null;
        }
    }



    // --- Utility -------------------------------------------------------------------

    getTextWidth(text: string, font: string): number {
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');
        }
        const context = this._canvas.getContext('2d');
        context.font = font;
        return context.measureText(text).width;
    }
}
