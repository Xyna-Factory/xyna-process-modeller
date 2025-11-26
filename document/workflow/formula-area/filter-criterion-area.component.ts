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

import { XcI18nContextDirective, XcI18nTranslateDirective } from '../../../../../zeta/i18n/i18n.directive';
import { XcIconButtonComponent } from '../../../../../zeta/xc/xc-button/xc-icon-button.component';
import { XcFormLabelComponent } from '../../../../../zeta/xc/xc-form/xc-form-label/xc-form-label.component';
import { XcTooltipDirective } from '../../../../../zeta/xc/xc-tooltip/xc-tooltip.directive';
import { XoInsertFilterCriterionRequest } from '../../../xo/insert-filter-criterion-request.model';
import { XoInsertRequest } from '../../../xo/insert-request.model';
import { FormulaComponent } from '../formula/formula.component';
import { FormulaAreaComponent } from './formula-area.component';


@Component({
    selector: 'filter-criterion-area',
    templateUrl: './formula-area.component.html',
    styleUrls: ['./formula-area.component.scss'],
    imports: [XcFormLabelComponent, XcI18nTranslateDirective, XcI18nContextDirective, FormulaComponent, XcIconButtonComponent, XcTooltipDirective]
})
export class FilterCriterionAreaComponent extends FormulaAreaComponent {

    getInsertRequest(expression?: string): XoInsertRequest {
        return new XoInsertFilterCriterionRequest('', -1, expression ?? '');
    }
}
