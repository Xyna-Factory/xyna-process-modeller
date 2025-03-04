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
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

import { XmomPath } from '../../api/xmom.service';


export interface XMOMTreeItemState {
    xmomPath: XmomPath;
    selected: boolean;
    expanded: boolean;
    depth: number;
    path: string;
    ctrl: boolean;
}


@Component({
    selector: 'xfm-mod-nav-xmomtreeitem',
    templateUrl: './xmom-tree-item.component.html',
    styleUrls: ['./xmom-tree-item.component.scss'],
    standalone: false
})
export class XMOMTreeItemComponent {

    private _xmomPath: XmomPath;

    private _expanded: boolean;
    private _selected: boolean;

    private _selectedXmomPaths: XmomPath[];
    private _expandedXmomPaths: XmomPath[];

    @Output()
    readonly stateChange = new EventEmitter<XMOMTreeItemState>();


    @Input()
    set xmomPath(value: XmomPath) {
        this._xmomPath = value;
        // retrigger setter, in case xmom path was set afterwards
        this.selectedXmomPaths = this._selectedXmomPaths;
        this.expandedXmomPaths = this._expandedXmomPaths;
    }


    get xmomPath(): XmomPath {
        return this._xmomPath;
    }


    @Input()
    set selectedXmomPaths(value: XmomPath[]) {
        this._selectedXmomPaths = value || [];
        this._selected = this.selectedXmomPaths.indexOf(this.xmomPath) >= 0;
    }


    get selectedXmomPaths(): XmomPath[] {
        return this._selectedXmomPaths;
    }


    @Input()
    set expandedXmomPaths(value: XmomPath[]) {
        this._expandedXmomPaths = value || [];
        this._expanded = this.expandedXmomPaths.indexOf(this.xmomPath) >= 0;
    }


    get expandedXmomPaths(): XmomPath[] {
        return this._expandedXmomPaths;
    }


    toggle() {
        const expanded = !this.expanded;
        this.change({
            xmomPath: this.xmomPath,
            selected: this.selected,
            expanded: expanded,
            depth: -1,
            path: '',
            ctrl: true
        });
    }


    select(ctrl: boolean) {
        const selected = ctrl ? !this.selected : true;
        this.change({
            xmomPath: this.xmomPath,
            selected: selected,
            expanded: this.expanded,
            depth: -1,
            path: '',
            ctrl: ctrl
        });
    }


    change(state: XMOMTreeItemState) {
        this.stateChange.emit({
            xmomPath: state.xmomPath,
            selected: state.selected,
            expanded: state.expanded,
            depth: state.depth + 1,
            path: [this.path, state.path].filter(v => v).join('.'),
            ctrl: state.ctrl
        });
    }


    @HostBinding('class.selected')
    get selected(): boolean {
        return this._selected;
    }


    @HostBinding('class.expanded')
    get expanded(): boolean {
        return this._expanded;
    }


    @HostBinding('class.root')
    @Input()
    root: boolean;


    get children(): XmomPath[] {
        return this.xmomPath.children || [];
    }


    get name(): string {
        return this.xmomPath.isAbsolute
            ? ['[' + this.path + ']', this.label].filter(v => v).join(' - ')
            : this.path || this.label || '';
    }


    get path(): string {
        return this.xmomPath.path;
    }


    get label(): string {
        return this.xmomPath.label;
    }
}
