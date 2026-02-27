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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';

import { XoGlobalStorablePropertyArea } from '@pmod/xo/global-storable-property-area.model';

import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../zeta/i18n/i18n.module';


@Component({
    selector: 'global-storable-properties-area',
    templateUrl: './global-storable-properties-area.component.html',
    styleUrls: ['./global-storable-properties-area.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcModule, I18nModule]
})
export class GlobalStorablePropertiesAreaComponent extends ModellingObjectComponent {

    protected readonly cdr = inject(ChangeDetectorRef);

    @Input()
    set propertiesArea(value: XoGlobalStorablePropertyArea) {
        this.setModel(value);
    }

    get propertiesArea(): XoGlobalStorablePropertyArea {
        return this.getModel() as XoGlobalStorablePropertyArea;
    }

    protected lockedChanged() {
        this.cdr.markForCheck();
    }
}
