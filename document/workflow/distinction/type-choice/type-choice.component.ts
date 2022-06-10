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
import { Component } from '@angular/core';

import { ModellingActionType } from '../../../../api/xmom.service';
import { XoRequest } from '../../../../xo/request.model';
import { XoTypeChoice } from '../../../../xo/type-choice.model';
import { ChoiceComponent } from '../choice.component';


@Component({
    selector: 'type-choice',
    templateUrl: './type-choice.component.html',
    styleUrls: ['../choice.component.scss', './type-choice.component.scss']
})
export class TypeChoiceComponent extends ChoiceComponent {

    complete() {
        const id = this.typeChoice.contentArea.id;
        this.performAction({ type: ModellingActionType.complete, objectId: id, request: new XoRequest() });
    }


    get typeChoice(): XoTypeChoice {
        return this.choice as XoTypeChoice;
    }
}
