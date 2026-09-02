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

import { NgTemplateOutlet } from '@angular/common';
import { Component, Input, TemplateRef, input } from '@angular/core';

import { XoLabelArea } from '../../../xo/label-area.model';
import { ModContentEditableDirective } from '../shared/mod-content-editable.directive';
import { TextAreaModellingObjectComponent } from '../shared/text-area-modelling-object.component';


@Component({
    selector: 'label-area',
    templateUrl: './label-area.component.html',
    styleUrls: ['./label-area.component.scss'],
    imports: [ModContentEditableDirective, NgTemplateOutlet]
})
export class LabelAreaComponent extends TextAreaModellingObjectComponent {

    readonly menuTemplateRef = input<TemplateRef<any>>(undefined);


    @Input()
    set labelArea(value: XoLabelArea) {
        this.setTextArea(value);
    }


    get labelArea(): XoLabelArea {
        return this.getTextArea() as XoLabelArea;
    }
}
