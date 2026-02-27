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

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeLabelRequest } from '../../../xo/change-label-request.model';
import { XoMethod } from '../../../xo/method.model';
import { SelectableModellingObjectComponent } from '../../workflow/shared/selectable-modelling-object.component';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { ModContentEditableDirective } from '../../workflow/shared/mod-content-editable.directive';


@Component({
    selector: 'member-service',
    templateUrl: './member-service.component.html',
    styleUrls: ['./member-service.component.scss'],
    imports: [XcModule, ModContentEditableDirective]
})
export class MemberServiceComponent extends SelectableModellingObjectComponent {

    @Input()
    set memberService(value: XoMethod) {
        this.setModel(value);
    }


    get memberService(): XoMethod {
        return this.getModel() as XoMethod;
    }


    finishEditing(text: string) {
        if (text !== this.memberService.label) {
            this.performAction({
                type: ModellingActionType.change,
                objectId: this.memberService.id,
                request: new XoChangeLabelRequest(undefined, text)
            });
        }
    }
}
