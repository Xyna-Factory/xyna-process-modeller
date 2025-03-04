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
import { Component, ElementRef, Injector, Input, Optional } from '@angular/core';
import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';

import { XcAutocompleteDataWrapper, XcOptionItem } from '@zeta/xc';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeRemoteDestinationRequest } from '../../../xo/change-remote-destination-request.model';
import { XoRemoteDestinationArea } from '../../../xo/remote-destination-area.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingObjectComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'remote-destination-area',
    templateUrl: './remote-destination-area.component.html',
    styleUrls: ['./remote-destination-area.component.scss'],
    standalone: false
})
export class RemoteDestinationAreaComponent extends ModellingObjectComponent {

    dataWrapper = new XcAutocompleteDataWrapper(
        () => this.remoteDestinationArea && this.remoteDestinationArea.usedDestination ? this.remoteDestinationArea.usedDestination.name : null,
        value => {
            const change = !!this.remoteDestinationArea.usedDestination;
            this.performAction({
                type: change ? ModellingActionType.change : ModellingActionType.insert,
                request: XoChangeRemoteDestinationRequest.withName(value),
                objectId: change ? this.remoteDestinationArea.usedDestination.id : this.remoteDestinationArea.id
            });
        }
    );


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        readonly detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
        documentService.xmomService.getRemoteDestinations().subscribe(remoteDestinations =>
            this.dataWrapper.values = [
                <XcOptionItem>{ name: '', value: '' },
                ...remoteDestinations.data.map(rd => <XcOptionItem>{ name: rd.name, value: rd.name })
            ]
        );
    }


    @Input()
    set remoteDestinationArea(value: XoRemoteDestinationArea) {
        this.setModel(value);
        this.dataWrapper.update();
    }


    get remoteDestinationArea(): XoRemoteDestinationArea {
        return this.getModel() as XoRemoteDestinationArea;
    }


    isDefaultCollapsed(): boolean {
        return false;
    }
}
