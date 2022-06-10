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

import { XcRichListItemComponent } from '@zeta/xc';

import { Subject } from 'rxjs/';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoUsedRequest } from '../../../xo/change-used-request.model';
import { XoJavaSharedLibrary } from '../../../xo/java-shared-library.model';
import { TriggeredAction } from '../../workflow/shared/modelling-object.component';


export interface JavaSharedLibItemData {
    item: XoJavaSharedLibrary;
    usedChangeSubject: Subject<TriggeredAction>;
    getComponentEditableState: () => boolean;
}


@Component({
    templateUrl: './java-shared-lib-item.component.html',
    styleUrls: ['./java-shared-lib-item.component.scss']
})
export class JavaSharedLibItemComponent extends XcRichListItemComponent<void, JavaSharedLibItemData> {

    // class as css selector
    @HostBinding('class')
    readonly clazz = 'java-shared-lib-item';


    constructor(injector: Injector) {
        super(injector);
    }


    get name(): string {
        return this.injectedData.item.name;
    }


    get used(): boolean {
        return this.injectedData.item.used;
    }


    set used(value: boolean) {
        if (this.injectedData.getComponentEditableState() && this.used !== value) {
            this.injectedData.item.used = value;
            const request = new XoUsedRequest(undefined, value);
            const triggeredAction: TriggeredAction = {
                type: ModellingActionType.change,
                objectId: this.injectedData.item.id,
                request
            };
            this.injectedData.usedChangeSubject.next(triggeredAction);
        }
    }
}
