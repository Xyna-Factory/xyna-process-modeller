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
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { XoChangeLabelRequest } from '@pmod/xo/change-label-request.model';

import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../../../zeta/xc/xc.module';
import { TypeDocumentationAreaComponent } from '../../type-documentation-area/type-documentation-area.component';
import { DatatypeMethodTabComponent } from '../datatype-tab.component';
import { XcModule } from '../../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';
import { TypeDocumentationAreaComponent } from '../../type-documentation-area/type-documentation-area.component';


@Component({
    templateUrl: './method-base-tab.component.html',
    styleUrls: ['./method-base-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcModule, I18nModule, TypeDocumentationAreaComponent]
})
export class MethodBaseTabComponent extends DatatypeMethodTabComponent {

    constructor() {
        super();

        this.untilDestroyed(this.injectedData.update).subscribe(() => {
            this.cdr.markForCheck();
        });
    }

    labelBlur(event: FocusEvent) {
        if (!this.readonly) {
            const value = (event.target as HTMLInputElement).value;
            if (this.method.label !== value) {
                this.method.label = value;
                this.performMethodChange(new XoChangeLabelRequest(undefined, value));
            }
        }
    }
}
