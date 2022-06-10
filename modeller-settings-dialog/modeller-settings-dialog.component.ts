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
import { Component, Injector, Optional } from '@angular/core';

import { WorkflowDetailSettingsService } from '@pmod/workflow-detail-settings.service';
import { I18nService } from '@zeta/i18n';
import { XcDialogComponent, XDSIconName } from '@zeta/xc';

import { modellerSettingsDialog_translations_de_DE } from './locale/modeller-settings-dialog-translations.de-DE';
import { modellerSettingsDialog_translations_en_US } from './locale/modeller-settings-dialog-translations.en-US';


@Component({
    templateUrl: './modeller-settings-dialog.component.html',
    styleUrls: ['./modeller-settings-dialog.component.scss']
})
export class ModellerSettingsDialogComponent extends XcDialogComponent<void, void> {

    constructor(@Optional() injector: Injector, readonly workflowSettings: WorkflowDetailSettingsService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(I18nService.DE_DE, modellerSettingsDialog_translations_de_DE);
        this.i18n.setTranslations(I18nService.EN_US, modellerSettingsDialog_translations_en_US);
    }


    get icons(): typeof XDSIconName {
        return XDSIconName;
    }
}
