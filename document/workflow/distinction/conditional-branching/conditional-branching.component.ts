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
import { Component } from '@angular/core';

import { ModellingActionType } from '../../../../api/xmom.service';
import { XoInsertBranchRequest } from '../../../../xo/insert-branch-request.model';
import { ChoiceComponent } from '../choice.component';


@Component({
    selector: 'conditional-branching',
    templateUrl: './conditional-branching.component.html',
    styleUrls: ['../choice.component.scss', './conditional-branching.component.scss'],
    standalone: false
})
export class ConditionalBranchingComponent extends ChoiceComponent {

    addBranch() {
        this.performAction({ type: ModellingActionType.insert, objectId: this.choice.contentArea.id, request: new XoInsertBranchRequest('', -1) });
    }
}
