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

import { ApiService, FullQualifiedName, RuntimeContext, Xo, XoDescriber, XoStructureArray } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcStructureTreeDataSource } from '@zeta/xc';

import { XoVariable } from '../../../xo/variable.model';
import { constantDialog_translations_de_DE } from './locale/constant-dialog-translations.de-DE';
import { constantDialog_translations_en_US } from './locale/constant-dialog-translations.en-US';


export interface ConstantDialogData {
    rtc: RuntimeContext;
    variable: XoVariable;
    constant: Xo;
    readonly?: boolean;
}

export const CONSTANT_DIALOG_DELETE_TOKEN = Symbol();


@Component({
    selector: 'constant-dialog',
    templateUrl: './constant-dialog.component.html',
    styleUrls: ['./constant-dialog.component.scss'],
    standalone: false
})
export class ConstantDialogComponent extends XcDialogComponent<Xo | typeof CONSTANT_DIALOG_DELETE_TOKEN, ConstantDialogData> {

    dataSource: XcStructureTreeDataSource;
    deletable = false;


    constructor(@Optional() injector: Injector, apiService: ApiService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, constantDialog_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, constantDialog_translations_en_US);


        const variable = this.injectedData.variable;
        const constant = this.injectedData.constant;
        const rtc = this.injectedData.rtc;
        // if the variable has a dynamic type, only its subtypes can be set as a constant
        const fqn = variable.castToFqn
            ? variable.castToFqn
            : variable.$fqn;
        // create describer for root data type
        const describer: XoDescriber = {
            fqn: FullQualifiedName.decode(fqn),
            rtc: constant?.rtc ?? rtc
        };
        // initialize tree data source
        this.dataSource = new XcStructureTreeDataSource(apiService, undefined, rtc, [describer]);
        this.dataSource.readonlyMode = this.injectedData.readonly;
        // set structure fallback to array, if list
        if (variable.isList) {
            this.dataSource.structureFallback = XoStructureArray;
        }
        // set constant, if any
        if (constant) {
            this.dataSource.container.append(constant.clone());
            this.deletable = true;
        }
        this.dataSource.refresh();
    }


    save() {
        const constant = this.injectedData.constant;
        const value = this.dataSource.container.data[0];
        // if nothing has been changed, just dismiss
        if (constant && value) {
            const c = constant.stringify();
            const v = value.stringify();
            if (c === v) {
                this.dismiss();
                return;
            }
        }
        // otherwise relay current value
        this.dismiss(value || null);
    }


    delete() {
        this.dismiss(CONSTANT_DIALOG_DELETE_TOKEN);
    }
}
