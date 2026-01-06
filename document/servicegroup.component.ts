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
import { Component } from '@angular/core';

import { ModellingActionType } from '../api/xmom.service';
import { XoChangeTextRequest } from '../xo/change-text-request.model';
import { XoInsertModellingObjectRequest } from '../xo/insert-modelling-object-request.model';
import { XoServiceGroup } from '../xo/service-group.model';
import { XoStaticMethod } from '../xo/static-method.model';
import { ServiceGroupDocumentModel } from './model/service-group-document.model';
import { SelectionService } from './selection.service';
import { TypeDocumentComponent } from './type-document.component';
import { MinMaxService } from './min-max.service';


@Component({
    templateUrl: './servicegroup.component.html',
    styleUrls: ['./servicegroup.component.scss'],
    providers: [SelectionService, MinMaxService], // single service instances per document
    standalone: false
})
export class ServiceGroupComponent extends TypeDocumentComponent<ServiceGroupDocumentModel> {

    get serviceGroup(): XoServiceGroup {
        return this.document.item;
    }


    addMethod() {
        this.performModellingAction({
            type: ModellingActionType.insert,
            objectId: this.serviceGroup.methodsArea.id,
            request: new XoInsertModellingObjectRequest('', -1, new XoStaticMethod().createInsertRequestContent())
        });
    }


    documentationBlur(event: Event) {
        if (!this.selectedMethod?.readonly) {
            const text = (event.target as HTMLTextAreaElement).value;
            if (this.selectedMethod.documentationArea.text !== text) {
                this.performModellingAction({
                    type: ModellingActionType.change,
                    objectId: this.selectedMethod.documentationArea.id,
                    request: new XoChangeTextRequest(undefined, text)
                });
            }
        }
    }
}
