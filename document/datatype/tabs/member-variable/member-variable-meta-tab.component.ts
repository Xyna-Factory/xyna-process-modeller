import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Optional } from '@angular/core';
import { DataTypeService } from '@pmod/document/datatype.service';
import { DocumentService } from '@pmod/document/document.service';
import { I18nService } from '@zeta/i18n';
import { XcRichListItem } from '@zeta/xc';
import { metaTag, MetaTagComponent } from './meta-tag-rich-list/meta-tag-rich-list.component';
import { DatatypeVariableTabComponent } from '../datatype-tab.component';

@Component({
    templateUrl: './member-variable-meta-tab.component.html',
    styleUrls: ['./member-variable-meta-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberVariableMetaTabComponent extends DatatypeVariableTabComponent {

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
