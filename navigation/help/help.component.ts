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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';

import { CommonNavigationComponent } from '../common-navigation-class/common-navigation-component';
import { I18nModule } from '../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../zeta/xc/xc.module';


@Component({
    selector: 'xfm-mod-nav-help',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [I18nModule, XcModule]
})
export class HelpComponent extends CommonNavigationComponent {

    assignmentTooltip = 'Simply typed "=" is assignment (:=)';
    comparisonTooltip = 'Twice typed "=" is comparison (=)';

    constructor(cdr: ChangeDetectorRef) {
        super(cdr);
    }
}
