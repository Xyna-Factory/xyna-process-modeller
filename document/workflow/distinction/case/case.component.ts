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
import { Component, HostListener, Input, input } from '@angular/core';
import { XoRequest } from '@pmod/xo/request.model';
import { XcIconButtonComponent, XcTooltipDirective } from '@zeta/xc';

import { XcI18nTranslateDirective } from '../../../../../../zeta/i18n';
import { ModellingActionType } from '../../../../api/xmom.service';
import { XoCase } from '../../../../xo/case.model';
import { XoChangeTextRequest } from '../../../../xo/change-text-request.model';
import { FormulaComponent } from '../../formula/formula.component';
import { ModellingItemComponent } from '../../shared/modelling-object.component';


@Component({
    selector: 'case',
    templateUrl: './case.component.html',
    styleUrls: ['./case.component.scss'],
    imports: [XcIconButtonComponent, XcTooltipDirective, XcI18nTranslateDirective, FormulaComponent]
})
export class CaseComponent extends ModellingItemComponent {

    readonly detachable = input<boolean>(undefined);


    @Input()
    set case(value: XoCase) {
        this.setModel(value);
    }


    get case(): XoCase {
        return this.getModel() as XoCase;
    }


    finishEditLabel(value: string) {
        if (this.case.label !== value) {
            this.performAction({
                type: ModellingActionType.change,
                objectId: this.case.id,
                request: new XoChangeTextRequest(undefined, value)
            });
        }
    }


    detach() {
        this.performAction({
            type: ModellingActionType.decouple,
            objectId: this.case.id,
            request: new XoRequest()
        });
    }


    @HostListener('keydown.enter', ['$event.target'])
    onKeydownEnter(target: any) {
        if (target.blur) {
            target.blur();
        }
    }
}
