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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { XmomPath } from '../../api/xmom.service';
import { XMOMTreeItemState, XMOMTreeItemComponent } from './xmom-tree-item.component';


@Component({
    selector: 'xfm-mod-nav-xmomtree',
    templateUrl: './xmom-tree.component.html',
    styleUrls: ['./xmom-tree.component.scss'],
    imports: [XMOMTreeItemComponent]
})
export class XMOMTreeComponent {

    @Input()
    selectedXmomPaths: XmomPath[];

    @Input()
    expandedXmomPaths: XmomPath[];

    @Input()
    xmomPaths: XmomPath[];

    @Output()
    readonly stateChange = new EventEmitter<XMOMTreeItemState>();


    change(state: XMOMTreeItemState) {
        this.stateChange.emit(state);
    }
}
