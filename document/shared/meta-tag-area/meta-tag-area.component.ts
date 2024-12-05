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

import { HttpMethod, ModellingActionType } from '@pmod/api/xmom.service';
import { ComponentMappingService } from '@pmod/document/component-mapping.service';
import { DocumentService } from '@pmod/document/document.service';
import { MetaTagComponent, MetaTagRichListData } from '@pmod/document/shared/meta-tag-rich-list/meta-tag-rich-list.component';
import { ModellingObjectComponent } from '@pmod/document/workflow/shared/modelling-object.component';
import { XoMetaTagArea } from '@pmod/xo/meta-tag-area.model';
import { XoMetaTagRequest } from '@pmod/xo/meta-tag-request.model';
import { XoMetaTag } from '@pmod/xo/meta-tag.model';
import { ApiService } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcRichListItem } from '@zeta/xc';

import { Subject } from 'rxjs';

import { WorkflowDetailLevelService } from '../../workflow-detail-level.service';


@Component({
  selector: 'meta-tag-area',
  templateUrl: './meta-tag-area.component.html',
  styleUrl: './meta-tag-area.component.scss'
})
export class MetaTagAreaComponent extends ModellingObjectComponent {

    get metaTagArea(): XoMetaTagArea {
        return this.getModel() as XoMetaTagArea;
    }

    @Input()
    set metaTagArea(value: XoMetaTagArea) {
        this.setModel(value);
        this.updateRichList();
    }

    @Input()
    objectIdKey = '';

    @Input()
    objectId = '';

    metaTagsItems: XcRichListItem<MetaTagRichListData>[] = [];
    newTag: string;
    removeSubject: Subject<XoMetaTag> = new Subject();

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        private readonly i18nService: I18nService,
        private readonly apiService: ApiService,
        detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        this.untilDestroyed(this.removeSubject.asObservable()).subscribe(metaTag => {
            this.removeMetaTag(metaTag);
        });
    }

    private updateRichList() {
        this.metaTagsItems = this.metaTagArea.metaTags.map(tag =>
            <XcRichListItem<MetaTagRichListData>>{
                component: MetaTagComponent,
                data: {
                    metaTag: tag,
                    removeSubject: this.removeSubject
                }
            }
        );
    }

    addMetaTag() {
        const metaTag: XoMetaTag = new XoMetaTag();
        metaTag.tag = this.newTag;
        const request: XoMetaTagRequest = new XoMetaTagRequest();
        request.metaTag = metaTag;
        this.performAction({
            type: ModellingActionType.meta,
            objectIdKey: this.objectIdKey,
            objectId: this.objectId,
            request: request,
            method: HttpMethod.PUT
        });
    }

    removeMetaTag(metaTag: XoMetaTag) {
        this.performAction({
            type: ModellingActionType.meta,
            objectIdKey: this.objectIdKey,
            objectId: this.objectId,
            method: HttpMethod.DELETE,
            paramSet: {metaTagId: metaTag.id}
        });
    }
}
