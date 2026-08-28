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
import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { XcTooltipDirective } from '@zeta/xc';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeLabelRequest } from '../../../xo/change-label-request.model';
import { XoMemberVariable } from '../../../xo/member-variable.model';
import { ModContentEditableDirective } from '../../workflow/shared/mod-content-editable.directive';
import { SelectableModellingObjectComponent } from '../../workflow/shared/selectable-modelling-object.component';


@Component({
    selector: 'member-variable',
    templateUrl: './member-variable.component.html',
    styleUrls: ['./member-variable.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ModContentEditableDirective, XcTooltipDirective]
})
export class MemberVariableComponent extends SelectableModellingObjectComponent {

    readonly memberVariable = input<XoMemberVariable>(null, { alias: 'memberVariable' });

    constructor() {
        super();
        effect(() => this.setModel(this.memberVariable()));
    }


    get label(): string {
        return this.memberVariable()?.label || '\u00A0';
    }


    get type(): string {
        const memberVariable = this.memberVariable();
        return memberVariable?.primitiveType || memberVariable?.$fqn || '\u00A0';
    }

    finishEditing(text: string) {
        const memberVariable = this.memberVariable();
        if (memberVariable && text !== memberVariable.label) {
            this.performAction({
                type: ModellingActionType.change,
                objectId: memberVariable.id,
                request: new XoChangeLabelRequest(undefined, text)
            });
        }
    }
}
