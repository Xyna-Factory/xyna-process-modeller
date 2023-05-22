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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, Input, Optional } from '@angular/core';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeTextRequest } from '../../../xo/change-text-request.model';
import { XoTextArea } from '../../../xo/text-area.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { WorkflowDetailLevelService } from '../../workflow-detail-level.service';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';


@Component({
    selector: 'type-documentation-area',
    templateUrl: './type-documentation-area.component.html',
    styleUrls: ['./type-documentation-area.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypeDocumentationAreaComponent extends ModellingObjectComponent {

    documentation: string;

    @Input()
    lines: number;


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        private readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
    }


    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    @Input()
    set documentationArea(value: XoTextArea) {
        this.setModel(value);
        this.documentation = value.text;
    }


    get documentationArea(): XoTextArea {
        return this.getModel() as XoTextArea;
    }


    documentationFieldBlur(event: FocusEvent) {
        const text = (event.target as HTMLTextAreaElement).value;
        if (!this.readonly && text !== this.documentation) {
            this.documentation = text;
            this.performAction({
                type: ModellingActionType.change,
                objectId: this.documentationArea.id,
                request: new XoChangeTextRequest(undefined, text)
            });
        }
    }
}
