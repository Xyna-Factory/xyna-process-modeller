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

import { Component, input, Input, OnInit } from '@angular/core';

import { XoDetailsItem } from '@pmod/xo/details-item.model';

import { SelectableModellingObjectComponent } from '../../workflow/shared/selectable-modelling-object.component';


@Component({
    selector: 'details-item',
    templateUrl: './details-item.component.html',
    styleUrls: ['./details-item.component.scss'],
    standalone: false
})
export class DetailsItemComponent extends SelectableModellingObjectComponent implements OnInit {

    @Input()
    set detailsItem(value: XoDetailsItem) {
        this.setModel(value);
    }

    get detailsItem(): XoDetailsItem {
        return this.getModel() as XoDetailsItem;
    }

    icon = input.required<string>()

    ngOnInit(): void {
        this.select();
    }

}
