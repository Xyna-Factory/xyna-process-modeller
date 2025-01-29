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
import { Component, Injector, Optional } from '@angular/core';

import { ApiService, RuntimeContext } from '@zeta/api';
import { downloadFile } from '@zeta/base';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent } from '@zeta/xc';

import { DocumentService } from '../../../document/document.service';
import { FactoryService } from '../../factory.service';
import { WorkflowConstantBuilder } from '../workflow-constant-builder.class';
import { workflowConstantBuilderModal_translations_de_DE } from './locale/workflow-constant-builder-modal-translations.de-DE';
import { workflowConstantBuilderModal_translations_en_US } from './locale/workflow-constant-builder-modal-translations.en-US';


@Component({
    templateUrl: './workflow-constant-builder-modal.component.html',
    styleUrls: ['./workflow-constant-builder-modal.component.scss'],
    standalone: false
})
export class WorkflowConstantBuilderModalComponent extends XcDialogComponent<void, void> {

    rtcDataWrapper: XcAutocompleteDataWrapper;
    rtc = RuntimeContext.defaultWorkspace;
    searchCriteria = '';
    constName = 'WF_CONST';
    withSignature = true;
    building = false;

    constructor(@Optional() injector: Injector,
        factoryService: FactoryService,
        private readonly documentService: DocumentService,
        private readonly apiService: ApiService,
        private readonly i18n: I18nService
    ) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, workflowConstantBuilderModal_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, workflowConstantBuilderModal_translations_en_US);

        this.rtcDataWrapper = new XcAutocompleteDataWrapper(
            () => this.rtc,
            val => this.rtc = val,
            factoryService.runtimeContextDataWrapper.values
        );
    }


    build() {

        if (!this.searchCriteria) {
            console.log('no criteria found');
        }

        const criteria = this.searchCriteria.split('\n');
        this.building = true;

        WorkflowConstantBuilder.build(
            this.documentService,
            this.apiService,
            this.rtc,
            criteria,
            this.constName,
            this.withSignature
        ).subscribe(
            res => downloadFile(res, 'const_file.txt'),
            err => this.building = false,
            () => this.building = false
        );

    }
}
