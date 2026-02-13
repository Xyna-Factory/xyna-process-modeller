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
import { Component, Injector, inject } from '@angular/core';

import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent } from '@zeta/xc';

import { conflictDialog_translations_de_DE } from './locale/conflict-dialog-translations.de-DE';
import { conflictDialog_translations_en_US } from './locale/conflict-dialog-translations.en-US';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../zeta/i18n/i18n.module';


export interface ConflictHandling {
    key: string;
    value: string;
    description: string;
}


export interface ConflictDialogData {
    title: string;
    message: string;
    handlings: ConflictHandling[];
}


@Component({
    templateUrl: './conflict-dialog.component.html',
    styleUrls: ['./conflict-dialog.component.scss'],
    imports: [XcModule, I18nModule]
})
export class ConflictDialogComponent extends XcDialogComponent<string, ConflictDialogData> {

    key: string;


    constructor() {
        const injector = inject(Injector);
        const i18nService = inject(I18nService);

        super(injector);

        i18nService.setTranslations(LocaleService.DE_DE, conflictDialog_translations_de_DE);
        i18nService.setTranslations(LocaleService.EN_US, conflictDialog_translations_en_US);
    }


    isChecked(key: string): boolean {
        return this.key === key;
    }


    check(key: string, checked: boolean) {
        if (checked) {
            this.key = key;
        }
    }
}
