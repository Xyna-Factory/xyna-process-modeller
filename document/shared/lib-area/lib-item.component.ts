/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { Component, HostBinding, Injector } from '@angular/core';

import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcRichListItemComponent } from '@zeta/xc';

import { Subject } from 'rxjs';

export interface LibItemData {
    libraryName: string;
    index: number;
    deleteItemSubject: Subject<number>;
    i18nService: I18nService;
    getComponentEditableState: () => boolean;
}

@Component({
    templateUrl: './lib-item.component.html',
    styleUrls: [ './lib-item.component.scss']
})
export class LibItemComponent extends XcRichListItemComponent<void, LibItemData> {

    get name(): string {
        return this.injectedData.libraryName;
    }

    constructor(injector: Injector, private readonly dialogService: XcDialogService) {
        super(injector);
    }

    delete() {
        const title = this.injectedData.i18nService.translate('Confirm');
        const message = this.injectedData.i18nService.translate('Would you like to delete the %name% Library?', { key: '%name%', value: this.name });
        this.dialogService.confirm(title, message).afterDismiss().subscribe(res => {
            if (res) {
                this.injectedData.deleteItemSubject.next(this.injectedData.index);
                this.dismiss();
            }
        });
    }

    // class as css selector
    @HostBinding('class')
    readonly clazz = 'lib-item';
}
