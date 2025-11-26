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

import { XcI18nContextDirective, XcI18nTranslateDirective } from '../../../../../zeta/i18n/i18n.directive';
import { XcButtonComponent } from '../../../../../zeta/xc/xc-button/xc-button.component';
import { XcDialogWrapperComponent } from '../../../../../zeta/xc/xc-dialog/xc-dialog-wrapper.component';
import { XcIconComponent } from '../../../../../zeta/xc/xc-icon/xc-icon.component';
import { XoRepairEntry, XoRepairEntryArray } from '../../../xo/repair-entry.model';
import { repairDialog_translations_de_DE } from './locale/repair-dialog-translations.de-DE';
import { repairDialog_translations_en_US } from './locale/repair-dialog-translations.en-US';
import { RepairEntryComponent } from './repair-entry/repair-entry.component';


export interface RepairDialogData {
    repairEntries?: XoRepairEntryArray;
    preRepair: boolean;     // true if a pre-repair dialog is shown. If false, there's no option to start the repair
}



@Component({
    templateUrl: './repair-dialog.component.html',
    styleUrls: ['./repair-dialog.component.scss'],
    imports: [XcDialogWrapperComponent, XcI18nContextDirective, XcIconComponent, XcI18nTranslateDirective, RepairEntryComponent, XcButtonComponent]
})
export class RepairDialogComponent extends XcDialogComponent<boolean, RepairDialogData> {

    get entries(): XoRepairEntry[] {
        return this.injectedData.repairEntries ? this.injectedData.repairEntries.data : [];
    }

    constructor(injector: Injector, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, repairDialog_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, repairDialog_translations_en_US);
    }
}
