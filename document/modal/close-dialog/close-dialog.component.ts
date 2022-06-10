/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
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
import { Component, Injector } from '@angular/core';

import { I18nService } from '@zeta/i18n';
import { XcDialogComponent } from '@zeta/xc';

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
    styleUrls: ['./close-dialog.component.scss']
})
export class CloseDialogComponent extends XcDialogComponent<CloseDialogResult, CloseDialogData> {

    constructor(injector: Injector, i18nService: I18nService) {
        super(injector);

        i18nService.setTranslations(I18nService.DE_DE, closeDialog_translations_de_DE);
        i18nService.setTranslations(I18nService.EN_US, closeDialog_translations_en_US);
    }
}
