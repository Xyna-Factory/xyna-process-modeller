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
import { closeDialog_translations_de_DE } from './locale/close-dialog-translations.de-DE';
import { closeDialog_translations_en_US } from './locale/close-dialog-translations.en-US';


export interface CloseDialogData {
    title: string;
    message: string;
    saveButtonLabel: string;
    dontSaveButtonLabel: string;
}

export interface CloseDialogResult {
    useForce: boolean;
    save: boolean;
}


@Component({
    templateUrl: './close-dialog.component.html',
    styleUrls: ['./close-dialog.component.scss'],
    imports: [XcModule, I18nModule]
})
export class CloseDialogComponent extends XcDialogComponent<CloseDialogResult, CloseDialogData> {
    readonly i18nService = inject(I18nService);

    constructor() {
        super();

        this.i18nService.setTranslations(LocaleService.DE_DE, closeDialog_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, closeDialog_translations_en_US);
    }
}
