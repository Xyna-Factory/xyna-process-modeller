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
import { XoMemberVariable } from '../../../xo/member-variable.model';
import { SelectableModellingObjectComponent } from '../../workflow/shared/selectable-modelling-object.component';


@Component({
    selector: 'member-variable',
    templateUrl: './member-variable.component.html',
    styleUrls: ['./member-variable.component.scss']
})
export class MemberVariableComponent extends SelectableModellingObjectComponent {

    @Input()
    set memberVariable(value: XoMemberVariable) {
        this.setModel(value);
    }


    get memberVariable(): XoMemberVariable {
        return this.getModel() as XoMemberVariable;
    }


    get label(): string {
        return this.memberVariable.label || '\u00A0';
    }


    get type(): string {
        return this.memberVariable.primitiveType || this.memberVariable.$fqn || '\u00A0';
    }


    finishEditing(text: string) {
        if (text !== this.memberVariable.label) {
            this.performAction({
                type: ModellingActionType.change,
                objectId: this.memberVariable.id,
                request: new XoChangeLabelRequest(undefined, text)
            });
        }
    }
}
