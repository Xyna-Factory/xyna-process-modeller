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
import { I18nModule } from '../../../zeta/i18n/i18n.module';
import { TypeInfoAreaComponent } from './datatype/type-info-area/type-info-area.component';
import { LibAreaComponent } from './shared/lib-area/lib-area.component';
import { JavaSharedLibAreaComponent } from './shared/java-shared-lib-area/java-shared-lib-area.component';
import { MemberAreaComponent } from './shared/member-area/member-area.component';
import { ServiceAreaComponent } from './datatype/service-area/service-area.component';
import { MethodDetailsComponent } from './datatype/method-details/method-details.component';
import { DropIndicatorComponent } from './workflow/drop-indicator/drop-indicator.component';


@Component({
    templateUrl: './servicegroup.component.html',
    styleUrls: ['./servicegroup.component.scss'],
    // single service instances per document
    providers: [SelectionService],
    imports: [I18nModule, TypeInfoAreaComponent, LibAreaComponent, JavaSharedLibAreaComponent, MemberAreaComponent, ServiceAreaComponent, MethodDetailsComponent, DropIndicatorComponent]
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
