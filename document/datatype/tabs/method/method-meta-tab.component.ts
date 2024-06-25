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
