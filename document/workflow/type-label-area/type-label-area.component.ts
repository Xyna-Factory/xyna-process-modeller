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
import { Component, HostBinding, inject, Input, TemplateRef } from '@angular/core';

import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';

import { XoTypeLabelArea } from '../../../xo/type-label-area.model';
import { ModellingObjectComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'type-label-area',
    templateUrl: './type-label-area.component.html',
    styleUrls: ['./type-label-area.component.scss'],
    standalone: false
})
export class TypeLabelAreaComponent extends ModellingObjectComponent {

    protected readonly detailLevelService = inject(WorkflowDetailLevelService);

    @Input()
    menuTemplateRef: TemplateRef<any> = null;

    @HostBinding('class.show-fqn')
    showFqn: boolean;


    @Input()
    set typeLabelArea(value: XoTypeLabelArea) {
        this.setModel(value);
    }


    get typeLabelArea(): XoTypeLabelArea {
        return this.getModel() as XoTypeLabelArea;
    }


    constructor() {
        super();
        this.untilDestroyed(this.detailLevelService.showFQNChange()).subscribe(show => this.showFqn = show);
    }
}
