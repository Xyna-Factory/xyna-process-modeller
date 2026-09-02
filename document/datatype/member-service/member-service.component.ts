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
import { Component, effect, input } from '@angular/core';
import { XcTooltipDirective } from '@zeta/xc';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeLabelRequest } from '../../../xo/change-label-request.model';
import { XoMethod } from '../../../xo/method.model';
import { ModContentEditableDirective } from '../../workflow/shared/mod-content-editable.directive';
import { SelectableModellingObjectComponent } from '../../workflow/shared/selectable-modelling-object.component';


@Component({
    selector: 'member-service',
    templateUrl: './member-service.component.html',
    styleUrls: ['./member-service.component.scss'],
    imports: [XcTooltipDirective, ModContentEditableDirective]
})
export class MemberServiceComponent extends SelectableModellingObjectComponent {

    readonly memberService = input<XoMethod>(null, { alias: 'memberService' });

    constructor() {
        super();
        effect(() => this.setModel(this.memberService()));
    }


    finishEditing(text: string) {
        const memberService = this.memberService();
        if (memberService && text !== memberService.label) {
            this.performAction({
                type: ModellingActionType.change,
                objectId: memberService.id,
                request: new XoChangeLabelRequest(undefined, text)
            });
        }
    }
}
