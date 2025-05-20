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
import { ChangeDetectorRef, Component, inject, Input} from '@angular/core';
import { ModellingActionType } from '@pmod/api/xmom.service';
import { ModellingItemComponent } from '@pmod/document/workflow/shared/modelling-object.component';
import { XoChangeMetaTagRequest } from '@pmod/xo/change-meta-tag-request.model';
import { XoDeleteRequest } from '@pmod/xo/delete-request.model';
import { XoMetaTag } from '@pmod/xo/meta-tag.model';
import { ModContentEditableDirective } from '../../workflow/shared/mod-content-editable.directive';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../zeta/i18n/i18n.module';

@Component({
    selector: 'meta-tag',
    templateUrl: './meta-tag.component.html',
    styleUrls: ['./meta-tag.component.scss'],
    imports: [ModContentEditableDirective, XcModule, I18nModule]
})
export class MetaTagComponent extends ModellingItemComponent {

    private readonly cdr: ChangeDetectorRef = inject<ChangeDetectorRef>(ChangeDetectorRef);

    @Input('meta-tag')
    set metaTag(value: XoMetaTag) {
        this.setModel(value);
    }

    get metaTag(): XoMetaTag {
        return this.getModel() as XoMetaTag;
    }

    protected lockedChanged() {
        this.cdr.markForCheck();
    }

    removeMetaTag(metaTag: XoMetaTag) {
        this.performAction({
            type: ModellingActionType.delete,
            objectId: metaTag.id,
            request: new XoDeleteRequest(undefined, false)
        });
    }

    changeMetaTag(text: string) {
        if (text !== this.metaTag.tag) {
            const request: XoChangeMetaTagRequest = new XoChangeMetaTagRequest();
            request.tag = text;
            this.performAction({
                type: ModellingActionType.change,
                objectId: this.metaTag.id,
                request: request
            });
        }
    }
}
