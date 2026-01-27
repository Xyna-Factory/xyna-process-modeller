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
import { Component, forwardRef, Input } from '@angular/core';

import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../../../zeta/xc/xc.module';
import { ModellingActionType } from '../../../../api/xmom.service';
import { XoChangeCompensationRequest } from '../../../../xo/change-compensation-request.model';
import { XoCompensation } from '../../../../xo/compensation.model';
import { ContentAreaComponent } from '../../content-area/content-area.component';
import { ModellingItemComponent } from '../../shared/modelling-object.component';


@Component({
    selector: 'compensation',
    templateUrl: './compensation.component.html',
    styleUrls: ['./compensation.component.scss', '../../common.scss'],
    imports: [I18nModule, forwardRef(() => ContentAreaComponent), XcModule]
})
export class CompensationComponent extends ModellingItemComponent {

    @Input()
    set compensation(value: XoCompensation) {
        this.setModel(value);
    }


    get compensation(): XoCompensation {
        return this.getModel() as XoCompensation;
    }


    overrideCompensation(override: boolean) {
        this.performAction({
            type: ModellingActionType.change,
            objectId: undefined,    // filled by containing invocation
            request: XoChangeCompensationRequest.override(override)
        });
        if (!override) {
            this.setCollapsed(true);
        }
    }
}
