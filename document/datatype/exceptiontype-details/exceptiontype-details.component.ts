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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, Input, OnDestroy, Optional } from '@angular/core';

import { XoDetailsItem } from '@pmod/xo/details-item.model';
import { XoExceptionType } from '@pmod/xo/exception-type.model';
import { I18nService } from '@zeta/i18n';
import { XcTabBarItem } from '@zeta/xc';

import { BehaviorSubject, Subject } from 'rxjs';

import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { WorkflowDetailLevelService } from '../../workflow-detail-level.service';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { DocumentationTabData, DocumentTabData } from '../tabs/datatype-tab.component';
import { DocumentationTabComponent } from '../tabs/shared/documentation-tab.component';


@Component({
    selector: 'exceptiontype-details',
    templateUrl: './exceptiontype-details.component.html',
    styleUrls: ['./exceptiontype-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExceptionTypeDetailsComponent extends ModellingItemComponent implements OnDestroy {

    get exceptionType(): XoExceptionType {
        return this.getModel() as XoExceptionType;
    }

    @Input()
    set exceptionType(value: XoExceptionType) {
        this.setModel(value);
        if (value) {
            this.docTabUpdate.next(this.buildDocTabData());
        }
        this.cdr.markForCheck();
    }

    @Input()
    set detailsItem(value: XoDetailsItem) {
        if (value) {
            this.docTabUpdate.next(this.buildDocTabData());
        }
        this.cdr.markForCheck();
    }

    docTabUpdate: Subject<DocumentationTabData> = new BehaviorSubject(this.buildDocTabData());

    readonly documentationTabItem: XcTabBarItem<DocumentTabData<DocumentationTabData>> = {
        closable: false,
        component: DocumentationTabComponent,
        name: this.i18nService.translate('pmod.datatype.type-documentation-area.documentation-label'),
        data: <DocumentTabData<DocumentationTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            readonly: this.readonly,
            update: this.docTabUpdate.asObservable()
        }
    };

    tabBarSelection: XcTabBarItem<DocumentTabData<any>>;
    tabBarItems: XcTabBarItem<DocumentTabData<any>>[];

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        private readonly i18nService: I18nService,
        private readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
        this.tabBarSelection = this.documentationTabItem;
        this.updateTabBarItemList();
    }

    ngOnDestroy() {
        this.docTabUpdate.complete();
        super.ngOnDestroy();
    }

    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    private buildDocTabData(): DocumentationTabData {
        return <DocumentationTabData> {
            documentationArea: this.exceptionType?.documentationArea,
            readonly: this.readonly
        };
    }

    private updateTabBarItemList() {
        this.tabBarItems = [this.documentationTabItem];
        this.cdr.markForCheck();
    }
}
