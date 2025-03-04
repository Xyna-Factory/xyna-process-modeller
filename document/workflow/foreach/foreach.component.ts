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
import { Component, ElementRef, HostBinding, Injector, Input, Optional } from '@angular/core';

import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoForeach } from '../../../xo/foreach.model';
import { XoRequest } from '../../../xo/request.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingItemComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'foreach',
    templateUrl: './foreach.component.html',
    styleUrls: ['./foreach.component.scss'],
    standalone: false
})
export class ForeachComponent extends ModellingItemComponent {

    @HostBinding('class.foreach') foreachClass = true;


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        readonly detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        this.menuItems.push(...[
            // TODO activate as soon as backend supports change of execution type (PMOD-21)
            // <XcMenuItem>{
            //     name: 'parallel execution',
            //     translate: true,
            //     visible: _ => !this.foreach.parallelExecution,
            //     click: _ => this.toggleExecutionType()
            // },
            // <XcMenuItem>{
            //     name: 'sequential execution',
            //     translate: true,
            //     visible: _ => this.foreach.parallelExecution,
            //     click: _ => this.toggleExecutionType()
            // },
            // <XcMenuItem>{
            //     name: 'split merged foreaches',
            //     translate: true,
            //     visible: _ => this.foreach.isMergedForeach,
            //     click: _ => this.splitMergedForeach()
            // }
        ]);
    }


    @Input()
    set foreach(value: XoForeach) {
        this.setModel(value);
    }


    get foreach(): XoForeach {
        return this.getModel() as XoForeach;
    }


    // @HostBinding('class.innermost')
    // get isInnermost(): Boolean {
    //     return this.foreach.isInnermostForeach;
    // }


    toggleExecutionType() {
        this.performAction({ type: ModellingActionType.toggle, objectId: this.foreach.id, request: new XoRequest() });
    }


    swapWithOuterForeach() {
        const wrappingForeach = this.foreach.wrappingForeach;
        if (wrappingForeach) {
            this.performAction({ type: ModellingActionType.swap, objectId: wrappingForeach.id, request: new XoRequest() });
        }
    }


    splitMergedForeach() {
        this.performAction({ type: ModellingActionType.split, objectId: this.foreach.id, request: new XoRequest() });
    }
}
