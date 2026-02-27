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

import { DatatypeDetailsTabComponent } from '../datatype-tab.component';
import { GlobalStorablePropertiesAreaComponent } from '../../global-storable-properties-area/global-storable-properties-area.component';
import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';


@Component({
    templateUrl: './datatype-storable-tab.component.html',
    styleUrls: ['./datatype-storable-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [GlobalStorablePropertiesAreaComponent, I18nModule]
})
export class DataTypeStorableTabComponent extends DatatypeDetailsTabComponent {

}
