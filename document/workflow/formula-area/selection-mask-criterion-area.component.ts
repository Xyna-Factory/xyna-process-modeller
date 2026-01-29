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
import { Component } from '@angular/core';

import { XoInsertSelectionMaskRequest } from '@pmod/xo/insert-selection-mask-request.model';

import { XoInsertRequest } from '../../../xo/insert-request.model';
import { FormulaAreaComponent } from './formula-area.component';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../zeta/i18n/i18n.module';
import { FormulaComponent } from '../formula/formula.component';


@Component({
    selector: 'selection-mask-criterion-area',
    templateUrl: './formula-area.component.html',
    styleUrls: ['./formula-area.component.scss'],
    imports: [XcModule, I18nModule, FormulaComponent]
})
export class SelectionMaskCriterionAreaComponent extends FormulaAreaComponent {

    getInsertRequest(expression?: string): XoInsertRequest {
        return new XoInsertSelectionMaskRequest('', -1, expression ?? '');
    }
}
