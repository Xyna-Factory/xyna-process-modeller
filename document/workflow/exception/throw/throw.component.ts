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
import { Component, Input } from '@angular/core';

import { XoTextArea } from '../../../../xo/text-area.model';
import { XoThrow } from '../../../../xo/throw.model';
import { ModellingItemComponent } from '../../shared/modelling-object.component';


@Component({
    selector: 'throw',
    templateUrl: './throw.component.html',
    styleUrls: ['./throw.component.scss'],
    standalone: false
})
export class ThrowComponent extends ModellingItemComponent {

    @Input()
    set throw(value: XoThrow) {
        this.setModel(value);
    }


    get throw(): XoThrow {
        return this.getModel() as XoThrow;
    }


    get documentationArea(): XoTextArea {
        return this.throw.documentationArea;
    }
}
