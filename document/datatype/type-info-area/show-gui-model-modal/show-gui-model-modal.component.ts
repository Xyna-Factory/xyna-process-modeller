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

import { XoDataType } from '../../../../xo/data-type.model';
import { DataTypeConvertable, DataTypeConverterService, DataTypeProperty } from './data-type-converter.service';
import { showGui_translations_de_DE } from './locale/show-gui-translations.de-DE';
import { showGui_translations_en_US } from './locale/show-gui-translations.en-US';


export interface ShowGuiModelModalComponentData {
    datatype: XoDataType;
}


@Component({
    templateUrl: './show-gui-model-modal.component.html',
    styleUrls: ['./show-gui-model-modal.component.scss'],
    standalone: false
})
export class ShowGuiModelModalComponent extends XcDialogComponent<void, ShowGuiModelModalComponentData> {

    modelStr: string;
    convertable: DataTypeConvertable;
    copyAble = false;

    get convertableProperties(): DataTypeProperty[] {
        return this.convertable
            ? this.convertable.options.convertChildProperties
                ? [...this.convertable.childProperties, ...this.convertable.properties]
                : this.convertable.properties
            : [];
    }

    constructor(injector: Injector, private readonly dataTypeConverterService: DataTypeConverterService, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, showGui_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, showGui_translations_en_US);

        this.copyAble = document.queryCommandSupported('Copy');
        this.reset();
    }

    // TODO - find better solution
    guiUpdate() {
        setTimeout(() => this.update(), 100);
    }

    update(firstUpdate = false) {
        if (this.convertable) {
            if (firstUpdate && this.convertable.baseName === 'Storable') {
                this.convertable.options.convertInheritance = false;
            }
            this.modelStr = this.convertable.stringify();
        }
    }

    reset() {
        this.convertable = this.dataTypeConverterService.readXoDataType(this.injectedData.datatype);
        this.update(true);
        this.copyAble = document.queryCommandSupported('Copy');
    }

    addModelToClipboard() {
        // FIXME: Use copyToClipboard from zeta/base
        let res = false;
        if (this.copyAble) {
            const inp = '<textarea id=\'input\'></textarea>';

            const div = document.createElement('div');
            div.innerHTML = inp;
            const input = div.children[0] as HTMLTextAreaElement;
            input.value = this.modelStr;

            document.body.appendChild(input);

            input.select();
            res = document.execCommand('Copy');
            document.body.removeChild(input);
        } else {
            // eslint-disable-next-line no-alert
            alert('Your browser does not allow to copy text to your clipboard');
        }
        return res;
    }

    downloadModel() {
        const name = this.convertable.filename;
        this.downloadData(this.modelStr, name);
    }

    private downloadData(data: string, filename = 'download.txt', mime = 'text/plain') {

        const blob = new Blob([data], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        document.body.appendChild(a);
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

}
