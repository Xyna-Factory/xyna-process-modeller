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
import { Component, forwardRef } from '@angular/core';

import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../../../zeta/xc/xc.module';
import { ModellingActionType } from '../../../../api/xmom.service';
import { XoRequest } from '../../../../xo/request.model';
import { XoTypeChoice } from '../../../../xo/type-choice.model';
import { ContentAreaComponent } from '../../content-area/content-area.component';
import { FormulaInputAreaComponent } from '../../formula-input-area/formula-input-area.component';
import { VariableAreaChoiceComponent } from '../../variable-area/variable-area-choice.component';
import { ChoiceComponent } from '../choice.component';


@Component({
    selector: 'type-choice',
    templateUrl: './type-choice.component.html',
    styleUrls: ['../choice.component.scss', './type-choice.component.scss'],
    imports: [XcModule, I18nModule, FormulaInputAreaComponent, forwardRef(() => ContentAreaComponent), VariableAreaChoiceComponent]
})
export class TypeChoiceComponent extends ChoiceComponent {

    complete() {
        const id = this.typeChoice.contentArea.id;
        this.performAction({ type: ModellingActionType.complete, objectId: id, request: new XoRequest() });
    }


    get typeChoice(): XoTypeChoice {
        return this.choice as XoTypeChoice;
    }
}
