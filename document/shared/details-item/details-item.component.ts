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

import { Component, ElementRef, Injector, Input, Optional } from '@angular/core';

import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { XoDetailsItem } from '@pmod/xo/details-item.model';

import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { SelectionService } from '../../selection.service';
import { SelectableModellingObjectComponent } from '../../workflow/shared/selectable-modelling-object.component';


@Component({
    selector: 'details-item',
    templateUrl: './details-item.component.html',
    styleUrls: ['./details-item.component.scss']
})
export class DetailsItemComponent extends SelectableModellingObjectComponent {

    @Input() label: string;

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        readonly detailLevelService: WorkflowDetailLevelService,
        protected readonly selectionService: SelectionService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, selectionService, injector);

        const detailsItem = new XoDetailsItem();
        detailsItem.name = this.label;
        this.setModel(new XoDetailsItem());
    }
}
