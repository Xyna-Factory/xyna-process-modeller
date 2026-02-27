import { NgClass } from '@angular/common';
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
import { Component, ElementRef, EventEmitter, HostListener, inject, Input, OnInit, Output, ViewChild } from '@angular/core';


/** @deprecated */
@Component({
    selector: 'left-right-component',
    templateUrl: './left-right.component.html',
    styleUrls: ['./left-right.component.scss'],
    imports: [NgClass]
})
export class LeftRightComponent implements OnInit {
    private static _num = 0;
    leftId: string;
    rightId: string;

    @Output()
     
    readonly change = new EventEmitter<any[]>();

    @ViewChild('leftDropzone', {static: false})
    leftDropzone: ElementRef;

    @ViewChild('rightDropzone', {static: false})
    rightDropzone: ElementRef;

    private _draggingArrayItem: any;
    private get draggingArrayItem(): any {
        return this._draggingArrayItem;
    }
    private set draggingArrayItem(value: any) {
        this._draggingArrayItem = value;
        this.draggingSide = this.leftItems.includes(value) ? 'left' : 'right';
        this.draggingIndex = (this.draggingSide === 'left' ? this.leftItems : this.rightItems).indexOf(value);
    }
    private draggingSide: string;
    private draggingIndex: number;

    private _showFocusedLeft = false;
    private _showFocusedRight = false;

    private _focusedItemLeft: any;
    private _focusedItemRight: any;

    private get focusedItemLeft(): any {
        return this._focusedItemLeft;
    }
    private set focusedItemLeft(value: any) {
        this._focusedItemLeft = value;
        this.focusedIndexLeft = this.leftItems.indexOf(value);
        if (this.focusedIndexLeft >= 0) {
            const container: HTMLElement = this.leftDropzone.nativeElement;
            const focusedNode = (<HTMLElement>container.children[this.focusedIndexLeft]);
            this._scrollFocusedNodeIntoView(focusedNode, container);
        }
    }
    private get focusedItemRight(): any {
        return this._focusedItemRight;
    }
    private set focusedItemRight(value: any) {
        this._focusedItemRight = value;
        this.focusedIndexRight = this.rightItems.indexOf(value);
        if (this.focusedIndexRight >= 0) {
            const container: HTMLElement = this.rightDropzone.nativeElement;
            const focusedNode = (<HTMLElement>container.children[this.focusedIndexRight]);
            this._scrollFocusedNodeIntoView(focusedNode, container);
        }
    }
    focusedIndexLeft: number;
    focusedIndexRight: number;

    private _targetedArrayItem: any;
    private get targetedArrayItem(): any {
        return this._targetedArrayItem;
    }
    private set targetedArrayItem(value: any) {
        this._targetedArrayItem = value;
        this.targetedSide = this.leftItems.includes(value) ? 'left' : 'right';
        this.targetedIndex = (this.targetedSide === 'left' ? this.leftItems : this.rightItems).indexOf(value);
    }
    private targetedSide: string;
    private targetedIndex: number;

    private readonly _sideArrayMap = new Map<string, any[]>();
    private readonly _sideEmitterMap = new Map<string, EventEmitter<any[]>>();

    // ---------------------------------------------------------------- MEMBERS, GETTERS, SETTERS

    @Input()
    leftTitle = 'Left';

    @Input()
    rightTitle = 'Right';

    @Input()
    leftItems: any[];

    @Output()
    readonly leftItemsChange = new EventEmitter<any[]>();

    private _rightItems: any[] = [];

    get rightItems(): any[] {
        return this._rightItems;
    }

    @Input()
    set rightItems(value: any[]) {
        this._rightItems = value;
    }

    @Output()
    readonly rightItemsChange = new EventEmitter<any[]>();

    // ---------------------------------------------------------------- METHODS

    constructor() {
        this.leftId = 'left-list-box-id-number_' + LeftRightComponent._num;
        this.rightId = 'right-list-box-id-number_' + LeftRightComponent._num++;
    }

    ngOnInit() {
        this._sideArrayMap.set('left', this.leftItems).set('right', this.rightItems);
        this._sideEmitterMap.set('left', this.leftItemsChange).set('right', this.rightItemsChange);
    }

    _appendElement(dropzoneSide: string): any {
        const removeArray = this._sideArrayMap.get(this.draggingSide);
        const appendArray = this._sideArrayMap.get(dropzoneSide);

        removeArray.splice(this.draggingIndex, 1);
        appendArray.push(this.draggingArrayItem);

        this.focusedItemLeft = null;
        this.focusedItemRight = null;
        this.change.emit([this.leftItems, this.rightItems]);

    }

    _insertBeforeElement() {
        const removeArray = this._sideArrayMap.get(this.draggingSide);
        const insertArray = this._sideArrayMap.get(this.targetedSide);

        if (this.draggingSide === this.targetedSide) {
            insertArray.splice(this.targetedIndex, 0, this.draggingArrayItem);
            if (this.draggingIndex < this.targetedIndex) {
                removeArray.splice(this.draggingIndex, 1);
            } else {
                removeArray.splice(this.draggingIndex + 1, 1);
            }
        } else {
            removeArray.splice(this.draggingIndex, 1);
            insertArray.splice(this.targetedIndex, 0, this.draggingArrayItem);
        }

        this.focusedItemLeft = null;
        this.focusedItemRight = null;
        this.change.emit([this.leftItems, this.rightItems]);
    }

    getItemsClasses(item: any): string[] {
        const classes: string[] = ['item'];

        if (this.isItemFocused(item)) {
            classes.push('focused');
        }

        if (item === this.draggingArrayItem) {
            classes.push('dragging');
        }

        if (item === this.targetedArrayItem) {
            classes.push('targeted');
        }

        return classes;
    }

    isItemFocused(item: any) {
        return (this._showFocusedLeft && item === this.focusedItemLeft)
            || (this._showFocusedRight && item === this.focusedItemRight);
    }

    // ---------------------------------------------------------------- DRAG EVENT LISTENER

    itemDragStart(item: any) {
        this.draggingArrayItem = item;
    }

    itemMousedown(e: MouseEvent, item: any) {
        this.draggingSide = (<HTMLElement>e.target).parentElement.dataset.side === 'left' ? 'left' : 'right';
        if (this.draggingSide === 'left') {
            this.focusedItemLeft = item;
        } else {
            this.focusedItemRight = item;
        }
    }

    itemDragEnter(item: any) {
        this.targetedArrayItem = this.draggingArrayItem !== item ? item : null;
    }

    itemDragEnd() {
        this.targetedArrayItem = null;
        this.draggingArrayItem = null;
    }

    dropzoneDragOver(e: DragEvent) {
        const target = (<HTMLElement>e.target);
        if (target && target.classList.contains('dropzone')) {
            this.targetedArrayItem = null;
        }
        e.preventDefault();
    }

    dropzoneDrop(e: DragEvent) {
        const dropzoneElement = <HTMLElement>e.currentTarget;

        if (this.draggingArrayItem !== this.targetedArrayItem) {

            if (this.targetedArrayItem) {
                this._insertBeforeElement();
            } else {
                this._appendElement(dropzoneElement.dataset.side);
            }

            this.rightItemsChange.emit(this.rightItems);
            this.leftItemsChange.emit(this.leftItems);
        }

        this.targetedArrayItem = null;
        this.draggingArrayItem = null;

    }

    // ----------------------------------------------------------------  EVENT LISTENER FOR ACCESSABILITY

    @HostListener('keyup', ['$event'])
    onkeyup(e: KeyboardEvent) {
        if (this._showFocusedLeft) {
            this.onkeyupLeft(e);
        }

        if (this._showFocusedRight) {
            this.onkeyupRight(e);
        }

        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        return false;
    }

    onkeyupLeft(e: KeyboardEvent) {
        if ([38, 40].includes(e.keyCode) && !this.focusedItemLeft && this.leftItems.length) {
            this.focusedItemLeft = this.leftItems[0];
            return false;
        }
        if ([13].includes(e.keyCode) && this.focusedItemLeft && this.leftItems.length) {
            this.leftItems.splice(this.focusedIndexLeft, 1);
            this.rightItems.splice(this.focusedIndexLeft, 0, this.focusedItemLeft);
            const nextIndex = this.leftItems.length && this.focusedIndexLeft === this.leftItems.length
                ? this.focusedIndexLeft - 1
                : this.focusedIndexLeft;
            this.focusedItemLeft = this.leftItems[nextIndex];
            this.change.emit([this.leftItems, this.rightItems]);
            return false;
        }
        if (e.ctrlKey) {
            this._pushFocusedItemLeft(e.keyCode);
        } else {
            this._moveFocusLeft(e.keyCode);
        }
    }

    onkeyupRight(e: KeyboardEvent) {

        if ([38, 40].includes(e.keyCode) && !this.focusedItemRight && this.rightItems.length) {
            this.focusedItemRight = this.rightItems[0];
            return false;
        }
        if ([13].includes(e.keyCode) && this.focusedItemRight && this.rightItems.length) {
            this.rightItems.splice(this.focusedIndexRight, 1);
            this.leftItems.splice(this.focusedIndexRight, 0, this.focusedItemRight);
            const nextIndex = this.rightItems.length && this.focusedIndexRight === this.rightItems.length
                ? this.focusedIndexRight - 1
                : this.focusedIndexRight;
            this.focusedItemRight = this.rightItems[nextIndex];
            this.change.emit([this.leftItems, this.rightItems]);
            return false;
        }
        if (e.ctrlKey) {
            this._pushFocusedItemRight(e.keyCode);
        } else {
            this._moveFocusRight(e.keyCode);
        }

    }


    private _moveFocusLeft(keyCode: number) {
        switch (keyCode) {
            // key: arrow up
            case 38: {
                if (this.leftItems[this.focusedIndexLeft - 1]) {
                    this.focusedItemLeft = this.leftItems[this.focusedIndexLeft - 1];
                }
            } break;
            // key: arrow down
            case 40: {
                if (this.leftItems[this.focusedIndexLeft + 1]) {
                    this.focusedItemLeft = this.leftItems[this.focusedIndexLeft + 1];
                }
            } break;
        }
    }

    private _moveFocusRight(keyCode: number) {
        switch (keyCode) {
            // key: arrow up
            case 38: {
                if (this.rightItems[this.focusedIndexRight - 1]) {
                    this.focusedItemRight = this.rightItems[this.focusedIndexRight - 1];
                }
            } break;
            // key: arrow down
            case 40: {
                if (this.rightItems[this.focusedIndexRight + 1]) {
                    this.focusedItemRight = this.rightItems[this.focusedIndexRight + 1];
                }
            } break;
        }
    }

    private _pushFocusedItemLeft(keyCode) {
        let tmp: any;
        switch (keyCode) {
            // key: arrow up
            case 38: {
                if (this.leftItems[this.focusedIndexLeft - 1]) {
                    tmp = this.leftItems[this.focusedIndexLeft - 1];
                    this.leftItems[this.focusedIndexLeft - 1] = this.leftItems[this.focusedIndexLeft];
                    this.leftItems[this.focusedIndexLeft] = tmp;
                    this.focusedItemLeft = this._focusedItemLeft;
                }
            } break;
            // key: arrow down
            case 40: {
                if (this.leftItems[this.focusedIndexLeft + 1]) {
                    tmp = this.leftItems[this.focusedIndexLeft + 1];
                    this.leftItems[this.focusedIndexLeft + 1] = this.leftItems[this.focusedIndexLeft];
                    this.leftItems[this.focusedIndexLeft] = tmp;
                    this.focusedItemLeft = this._focusedItemLeft;
                }
            } break;
        }
        this.leftItemsChange.emit(this.leftItems);
        this.change.emit([this.leftItems, this.rightItems]);
    }

    private _pushFocusedItemRight(keyCode) {
        let tmp: any;
        switch (keyCode) {
            // key: arrow up
            case 38: {
                if (this.rightItems[this.focusedIndexRight - 1]) {
                    tmp = this.rightItems[this.focusedIndexRight - 1];
                    this.rightItems[this.focusedIndexRight - 1] = this.rightItems[this.focusedIndexRight];
                    this.rightItems[this.focusedIndexRight] = tmp;
                    this.focusedItemRight = this._focusedItemRight;
                }
            } break;
            // key: arrow down
            case 40: {
                if (this.rightItems[this.focusedIndexRight + 1]) {
                    tmp = this.rightItems[this.focusedIndexRight + 1];
                    this.rightItems[this.focusedIndexRight + 1] = this.rightItems[this.focusedIndexRight];
                    this.rightItems[this.focusedIndexRight] = tmp;
                    this.focusedItemRight = this._focusedItemRight;
                }
            } break;
        }
        this.rightItemsChange.emit(this.rightItems);
        this.change.emit([this.leftItems, this.rightItems]);
    }

    onfocusLeft() {
        this._showFocusedLeft = true;
    }
    onblurLeft() {
        this._showFocusedLeft = false;
    }
    onfocusRight() {
        this._showFocusedRight = true;
    }
    onblurRight() {
        this._showFocusedRight = false;
    }

    private _scrollFocusedNodeIntoView(target: HTMLElement, container: HTMLElement) {
        const buffer = container.clientHeight * 0.2;
        const scroll = target.offsetTop - container.offsetTop;
        container.scrollTo({top: scroll - buffer});

    }
}
