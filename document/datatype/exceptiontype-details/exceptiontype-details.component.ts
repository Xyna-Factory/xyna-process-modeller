import { BehaviorSubject, Subject } from 'rxjs';

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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { XoDetailsItem } from '@pmod/xo/details-item.model';
import { XoExceptionType } from '@pmod/xo/exception-type.model';
import { I18nService } from '@zeta/i18n';
import { XcTabBarComponent, XcTabBarItem } from '@zeta/xc';

import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { DocumentationTabData, DocumentTabData } from '../tabs/datatype-tab.component';
import { DocumentationTabComponent } from '../tabs/shared/documentation-tab.component';


@Component({
    selector: 'exceptiontype-details',
    templateUrl: './exceptiontype-details.component.html',
    styleUrls: ['./exceptiontype-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcTabBarComponent]
})
export class ExceptionTypeDetailsComponent extends ModellingItemComponent implements OnDestroy {

    protected readonly i18nService = inject(I18nService);
    protected readonly cdr = inject(ChangeDetectorRef);

    readonly exceptionTypeInput = input<XoExceptionType>(null, { alias: 'exceptionType' });
    readonly detailsItem = input<XoDetailsItem>(null, { alias: 'detailsItem' });

    docTabUpdate: Subject<DocumentationTabData> = new BehaviorSubject(this.buildDocTabData());

    readonly tabBarSelection = signal<XcTabBarItem<DocumentTabData<any>>>(null);
    readonly tabBarItems = signal<XcTabBarItem<DocumentTabData<any>>[]>([]);

    constructor() {
        super();
        effect(() => this.refreshTabs());
    }

    ngOnDestroy() {
        this.docTabUpdate.complete();
        super.ngOnDestroy();
    }

    afterDocumentModelSet() {
        super.afterDocumentModelSet();
        this.tabBarItems().forEach(tabitem => {
            tabitem.data.documentModel = this.documentModel;
            tabitem.data.readonly = this.readonly;
        });
    }

    protected lockedChanged() {
        this.tabBarItems().forEach(tabitem => {
            tabitem.data.readonly = this.readonly;
        });
        this.cdr.markForCheck();
    }

    private buildDocTabData(exceptionType: XoExceptionType = null): DocumentationTabData {
        return <DocumentationTabData> {
            documentationArea: exceptionType?.documentationArea,
            readonly: this.readonly
        };
    }

    private refreshTabs() {
        const exceptionType = this.exceptionTypeInput();
        this.detailsItem();

        const documentationTabItem: XcTabBarItem<DocumentTabData<DocumentationTabData>> = {
            closable: false,
            component: DocumentationTabComponent,
            name: this.i18nService.translateSignal('pmod.datatype.type-documentation-area.documentation-label'),
            data: <DocumentTabData<DocumentationTabData>>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                readonly: this.readonly,
                update: this.docTabUpdate.asObservable()
            }
        };

        this.tabBarItems.set([documentationTabItem]);
        this.tabBarSelection.set(documentationTabItem);

        if (exceptionType) {
            this.setModel(exceptionType);
            this.docTabUpdate.next(this.buildDocTabData(exceptionType));
        }
    }
}
