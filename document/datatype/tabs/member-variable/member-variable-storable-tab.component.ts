/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { XoChangeMemberVariableStorableRoleRequest } from '@pmod/xo/change-member-variable-storable-role-request.model';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcOptionItemString, XcOptionItemTranslate } from '@zeta/xc';

import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../../../zeta/xc/xc.module';
import { StorablePropertiesAreaComponent } from '../../storable-properties-area/storable-properties-area.component';
import { DatatypeVariableTabComponent } from '../datatype-tab.component';


@Component({
    templateUrl: './member-variable-storable-tab.component.html',
    styleUrls: ['./member-variable-storable-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcModule, I18nModule, StorablePropertiesAreaComponent]
})
export class MemberVariableStorableTabComponent extends DatatypeVariableTabComponent {
    private readonly i18n = inject(I18nService);

    private static readonly ROLE_UID = 'uniqueIdentifier';
    private static readonly ROLE_HISTO_TS = 'historizationTimeStamp';
    private static readonly ROLE_CUR_VER_FLAG = 'currentVersionFlag';

    readonly storableRoleDataWrapper: XcAutocompleteDataWrapper<string>;

    constructor() {
        super();

        this.storableRoleDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.memberVariable.storableRole ?? '',
            value => {
                if (this.memberVariable.storableRole !== value) {
                    this.memberVariable.storableRole = value;
                    this.performMemberVariableChange(new XoChangeMemberVariableStorableRoleRequest(undefined, value));
                }
            }
        );
        this.untilDestroyed(this.injectedData.update).subscribe(() => {
            this.refreshStorableRoleAutocomplete();
        });
    }


    private refreshStorableRoleAutocomplete() {
        this.storableRoleDataWrapper.values = [
            XcOptionItemString(),
            XcOptionItemTranslate(this.i18n, MemberVariableStorableTabComponent.ROLE_UID),
            XcOptionItemTranslate(this.i18n, MemberVariableStorableTabComponent.ROLE_HISTO_TS),
            XcOptionItemTranslate(this.i18n, MemberVariableStorableTabComponent.ROLE_CUR_VER_FLAG)
        ];
    }
}

