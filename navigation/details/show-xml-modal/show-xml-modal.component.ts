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
import { Component, inject } from '@angular/core';

import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent } from '@zeta/xc';

import { I18nModule } from '../../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { showXMLModal_translations_de_DE } from './locale/show-xml-modal-translations.de-DE';
import { showXMLModal_translations_en_US } from './locale/show-xml-modal-translations.en-US';


export interface ShowXmlModalData {
    label: string;
    current: string;
    deployed: string;
    saved: string;
}


type XMLState = 'current' | 'saved' | 'deployed';

@Component({
    templateUrl: './show-xml-modal.component.html',
    styleUrls: ['./show-xml-modal.component.scss'],
    imports: [XcModule, I18nModule]
})
export class ShowXmlModalComponent extends XcDialogComponent<void, ShowXmlModalData> {
    private readonly i18n = inject(I18nService);


    mode: XMLState = 'current';


    get xml(): string {
        switch (this.mode) {
            case 'current':  return this.injectedData.current;
            case 'saved':    return this.injectedData.saved;
            case 'deployed': return this.injectedData.deployed;
            default: return undefined;
        }
    }


    constructor() {
        super();

        this.i18n.setTranslations(LocaleService.DE_DE, showXMLModal_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, showXMLModal_translations_en_US);
    }
}
