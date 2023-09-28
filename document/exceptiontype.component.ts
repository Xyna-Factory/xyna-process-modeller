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
import { XoExceptionType } from '../xo/exception-type.model';
import { XoInsertModellingObjectRequest } from '../xo/insert-modelling-object-request.model';
import { XoMemberVariable } from '../xo/member-variable.model';
import { ExceptionTypeDocumentModel } from './model/exception-type-document.model';
import { SelectionService } from './selection.service';
import { TypeDocumentComponent } from './type-document.component';


@Component({
    templateUrl: './exceptiontype.component.html',
    styleUrls: ['./exceptiontype.component.scss'],
    // single service instances per document
    providers: [SelectionService]
})
export class ExceptionTypeComponent extends TypeDocumentComponent<ExceptionTypeDocumentModel> {

    inheritedVariablesCollapsed = true;
    memberVariablesCollapsed = false;


    get exceptionType(): XoExceptionType {
        return this.document.item;
    }


    addMemberVariable() {
        this.performModellingAction({
            type: ModellingActionType.insert,
            objectId: this.exceptionType.memberVarsArea.id,
            request: new XoInsertModellingObjectRequest(undefined, -1, new XoMemberVariable().createInsertRequestContent())
        });
    }
}
