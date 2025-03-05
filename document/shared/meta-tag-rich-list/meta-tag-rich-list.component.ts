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
import { Component, Injector } from '@angular/core';
import { XoMetaTag } from '@pmod/xo/meta-tag.model';

import { XcRichListItemComponent } from '@zeta/xc';
import { Subject } from 'rxjs';

export interface MetaTagRichListData {
    metaTag: XoMetaTag;
    removeSubject: Subject<XoMetaTag>;
}

@Component({
    templateUrl: './meta-tag-rich-list.component.html',
    styleUrls: ['./meta-tag-rich-list.component.scss'],
    standalone: false
})
export class MetaTagComponent extends XcRichListItemComponent<void, MetaTagRichListData> {

    constructor(injector: Injector) {
        super(injector);
    }

    get tag(): string {
        return this.injectedData.metaTag.tag;
    }

    removeMetaTag() {
        this.injectedData.removeSubject.next(this.injectedData.metaTag);
    }
}
