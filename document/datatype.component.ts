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
import { Component, inject, Injector } from '@angular/core';

import { XoDetailsItem } from '@pmod/xo/details-item.model';

import { ModellingActionType } from '../api/xmom.service';
import { XoDataTypeTypeLabelArea } from '../xo/data-type-type-label-area.model';
import { XoDataType } from '../xo/data-type.model';
import { XoDynamicMethod } from '../xo/dynamic-method.model';
import { XoExceptionType } from '../xo/exception-type.model';
import { XoInsertModellingObjectRequest } from '../xo/insert-modelling-object-request.model';
import { XoMemberVariableArea } from '../xo/member-variable-area.model';
import { XoMemberVariable } from '../xo/member-variable.model';
import { MinMaxService } from './min-max.service';
import { DataTypeDocumentModel } from './model/data-type-document.model';
import { SelectionService } from './selection.service';
import { TypeDocumentComponent } from './type-document.component';


@Component({
    templateUrl: './datatype.component.html',
    styleUrls: ['./datatype.component.scss'],
    providers: [SelectionService, MinMaxService], // single service instances per document
    standalone: false
})
export class DataTypeComponent extends TypeDocumentComponent<DataTypeDocumentModel> {

    private readonly minmaxService = inject(MinMaxService);

    inheritedVariablesCollapsed = false;
    memberVariablesCollapsed = false;
    inheritedServicesCollapsed = false;
    overriddenServicesCollapsed = false;
    memberServicesCollapsed = false;

    minimized = this.minmaxService.minimized;

    constructor(injector: Injector) {
        super(injector);

        // workaround such that model types are not pruned by compiler

        const dataType = new XoDataType();
        const exceptionType = new XoExceptionType();
        const dataTypeTypeLabelArea = new XoDataTypeTypeLabelArea();
        const memberVariableArea = new XoMemberVariableArea();


        this.detailsItem = new XoDetailsItem();
        this.detailsItem.name = 'Data Type Details';
        this.selectedDetailsItem = this.detailsItem;
    }


    get dataType(): XoDataType {
        return this.document.item;
    }


    get isStorable(): boolean {
        return !!this.dataType.globalStorablePropertyArea.isStorable;
    }

    addMemberVariable() {
        this.performModellingAction({
            type: ModellingActionType.insert,
            objectId: this.dataType.memberVarsArea.id,
            request: new XoInsertModellingObjectRequest(undefined, -1, new XoMemberVariable().createInsertRequestContent())
        });
    }


    addMemberService() {
        this.performModellingAction({
            type: ModellingActionType.insert,
            objectId: this.dataType.memberMethodsArea.id,
            request: new XoInsertModellingObjectRequest(undefined, -1, new XoDynamicMethod().createInsertRequestContent())
        });
    }
}
