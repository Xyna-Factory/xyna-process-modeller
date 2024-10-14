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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Optional } from '@angular/core';

import { HttpMethod, ModellingActionType } from '@pmod/api/xmom.service';
import { DataTypeService } from '@pmod/document/datatype.service';
import { DocumentService } from '@pmod/document/document.service';
import { XoMetaTagRequest } from '@pmod/xo/meta-tag-request.model';
import { XoMetaTag } from '@pmod/xo/meta-tag.model';
import { I18nService } from '@zeta/i18n';
import { XcRichListItem } from '@zeta/xc';

import { Subject } from 'rxjs';

import { DatatypeVariableTabComponent } from '../datatype-tab.component';
import { MetaTagComponent, MetaTagRichListData } from './meta-tag-rich-list/meta-tag-rich-list.component';


@Component({
    selector: 'member-variable-meta-tab',
    templateUrl: './member-variable-meta-tab.component.html',
    styleUrls: ['./member-variable-meta-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberVariableMetaTabComponent extends DatatypeVariableTabComponent {

    metaTagsItems: XcRichListItem<MetaTagRichListData>[];
    newTag: string;
    removeSubject: Subject<XoMetaTag> = new Subject();

    constructor(
        documentService: DocumentService,
        private readonly dataTypeService: DataTypeService,
        private readonly i18n: I18nService,
        cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(documentService, cdr, injector);

        this.untilDestroyed(this.injectedData.update).subscribe(() => {
            this.refreshRichList();
        });

        this.untilDestroyed(this.removeSubject.asObservable()).subscribe(metaTag => {
            this.removeMetaTag(metaTag);
        });
    }

    private refreshRichList() {
        this.metaTagsItems = this.memberVariable.metaTagArea.metaTags.map(tag =>
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
            objectIdKey: 'members',
            objectId: this.memberVariable.name,
            request: request,
            method: HttpMethod.PUT
        });
    }

    removeMetaTag(metaTag: XoMetaTag) {
        this.performAction({
            type: ModellingActionType.meta,
            objectIdKey: 'members',
            objectId: this.memberVariable.name,
            method: HttpMethod.DELETE,
            paramSet: { metaTagId: metaTag.id }
        });
    }
}
