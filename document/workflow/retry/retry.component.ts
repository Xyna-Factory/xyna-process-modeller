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

import { XoRetry } from '../../../xo/retry.model';
import { XoTextArea } from '../../../xo/text-area.model';
import { ModellingItemComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'retry',
    templateUrl: './retry.component.html',
    styleUrls: ['./retry.component.scss']
})
export class RetryComponent extends ModellingItemComponent {

    @Input()
    set retry(value: XoRetry) {
        this.setModel(value);
    }


    get retry(): XoRetry {
        return this.getModel() as XoRetry;
    }


    get documentationArea(): XoTextArea {
        return this.retry.documentationArea;
    }
}
