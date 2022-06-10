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
import { Component, HostBinding, Injector } from '@angular/core';

import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcRichListItemComponent } from '@zeta/xc';

import { Subject } from 'rxjs/';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoDeleteRequest } from '../../../xo/delete-request.model';
import { XoJavaLibrary } from '../../../xo/java-library.model';
import { TriggeredAction } from '../../workflow/shared/modelling-object.component';


export interface JavaLibItemData {
    item: XoJavaLibrary;
    deleteItemSubject: Subject<TriggeredAction>;
    i18nService: I18nService;
    getComponentEditableState: () => boolean;
}

@Component({
    templateUrl: './java-lib-item.component.html',
    styleUrls: [ './java-lib-item.component.scss']
})
export class JavaLibItemComponent extends XcRichListItemComponent<void, JavaLibItemData> {

    get name(): string {
        return this.injectedData.item.name;
    }

    constructor(injector: Injector, private readonly dialogService: XcDialogService) {
        super(injector);
    }

    delete() {
        const title = this.injectedData.i18nService.translate('Confirm');
        const message = this.injectedData.i18nService.translate('Would you like to delete this Java Library?');
        this.dialogService.confirm(title, message).afterDismiss().subscribe(res => {
            if (res) {
                this.injectedData.deleteItemSubject.next({
                    type: ModellingActionType.delete,
                    objectId: this.injectedData.item.id,
                    request: new XoDeleteRequest(undefined, true)
                });
                this.dismiss();
            }
        });
    }

    // class as css selector
    @HostBinding('class')
    readonly clazz = 'java-lib-item';
}
