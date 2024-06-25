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
import { DataTypeService } from '@pmod/document/datatype.service';
import { DocumentService } from '@pmod/document/document.service';
import { I18nService } from '@zeta/i18n';
import { DatatypeMethodTabComponent } from '../datatype-tab.component';
import { XcRichListItem } from '@zeta/xc';
import { metaTag, MetaTagComponent } from '../member-variable/meta-tag-rich-list/meta-tag-rich-list.component';

@Component({
    templateUrl: './method-meta-tab.component.html',
    styleUrls: ['./method-meta-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MethodMetaTabComponent extends DatatypeMethodTabComponent {

    metaTagsItems: XcRichListItem<metaTag>[] = [];
    newTag: string;

    constructor(
        documentService: DocumentService,
        private readonly dataTypeService: DataTypeService,
        private readonly i18n: I18nService,
        cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(documentService, cdr, injector);
    }

    addMetaTag() {
        this.metaTagsItems.push({
            component: MetaTagComponent,
            data: {
                metaTag: this.newTag
            }
        });
    }
}
