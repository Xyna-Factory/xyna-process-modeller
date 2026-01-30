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

import { XoTextArea } from '@pmod/xo/text-area.model';

import { DatatypeTabComponent, DocumentationTabData } from '../datatype-tab.component';
import { TypeDocumentationAreaComponent } from '../../type-documentation-area/type-documentation-area.component';
import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';


@Component({
    templateUrl: './documentation-tab.component.html',
    styleUrls: ['./documentation-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TypeDocumentationAreaComponent, I18nModule]
})
export class DocumentationTabComponent extends DatatypeTabComponent<DocumentationTabData> {

    get documentationArea(): XoTextArea {
        return this.tabData?.documentationArea;
    }

}
