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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { XoArea } from '../../../xo/area.model';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';


@Component({
    selector: 'member-area',
    templateUrl: './member-area.component.html',
    styleUrls: ['./member-area.component.scss']
})
export class MemberAreaComponent extends ModellingObjectComponent {
    @Input()
    caption: string;

    @Input()
    collapsed = false;

    @Input()
    allowAdd = true;

    @Output('added')
    readonly addEmitter = new EventEmitter<void>();

    get hasContent(): boolean {
        return ((this.area as any).items) ? (this.area as any).items.length : false;
    }

    @Input()
    set area(area: XoArea) {
        this.setModel(area);
    }

    get area(): XoArea {
        return this.getModel() as XoArea;
    }
}
