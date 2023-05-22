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
import { Component, Injector } from '@angular/core';

import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent } from '@zeta/xc';

import { errorDialog_translations_de_DE } from './locale/error-dialog-translations.de-DE';
import { errorDialog_translations_en_US } from './locale/error-dialog-translations.en-US';


export interface ErrorDialogData {
    errorMessage: string;
    stackTrace?: string;
}



@Component({
    selector: 'error-dialog',
    templateUrl: './error-dialog.component.html',
    styleUrls: ['./error-dialog.component.scss']
})
export class ErrorDialogComponent extends XcDialogComponent<void, ErrorDialogData> {

    showStackTrace = false;


    constructor(injector: Injector, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, errorDialog_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, errorDialog_translations_en_US);
    }


    get errorMessage(): string {
        return this.injectedData.errorMessage;
    }


    get stackTrace(): string {
        return this.injectedData.stackTrace;
    }
}
