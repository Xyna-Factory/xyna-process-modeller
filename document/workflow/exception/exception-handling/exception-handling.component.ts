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
import { Component, forwardRef, HostBinding, Input } from '@angular/core';

import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';
import { XoExceptionHandling } from '../../../../xo/exception-handling.model';
import { ContentAreaComponent } from '../../content-area/content-area.component';
import { ModellingItemComponent } from '../../shared/modelling-object.component';
import { ItemBarAreaComponent } from '../item-bar-area/item-bar-area.component';


@Component({
    selector: 'exception-handling',
    templateUrl: './exception-handling.component.html',
    styleUrls: ['./exception-handling.component.scss', '../../common.scss'],
    imports: [I18nModule, forwardRef(() => ContentAreaComponent), forwardRef(() => ItemBarAreaComponent)]
})
export class ExceptionHandlingComponent extends ModellingItemComponent {

    @Input()
    @HostBinding('class.inline')
    inline = false;


    @Input()
    set exceptionHandling(value: XoExceptionHandling) {
        this.setModel(value);
    }


    get exceptionHandling(): XoExceptionHandling {
        return this.getModel() as XoExceptionHandling;
    }
}
