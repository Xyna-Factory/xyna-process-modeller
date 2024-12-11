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

import { XoDataType } from '@pmod/xo/data-type.model';
import { XoDetailsItem } from '@pmod/xo/details-item.model';
import { I18nService } from '@zeta/i18n';
import { XcTabBarItem } from '@zeta/xc';

import { BehaviorSubject, Subject } from 'rxjs';

import { XoRuntimeContext } from '../../../xo/runtime-context.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { WorkflowDetailLevelService } from '../../workflow-detail-level.service';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { BaseTabData, DataTypeTabData, DocumentationTabData, DocumentTabData, MetaTabData } from '../tabs/datatype-tab.component';
import { DataTypeStorableTabComponent } from '../tabs/datatype/datatype-storable-tab.component';
import { DocumentationTabComponent } from '../tabs/shared/documentation-tab.component';
import { MetaTabComponent } from '../tabs/shared/meta-tab.component';


@Component({
    selector: 'datatype-details',
    templateUrl: './datatype-details.component.html',
    styleUrls: ['./datatype-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTypeDetailsComponent extends ModellingItemComponent implements OnDestroy {

    @Input()
    dataTypeRTC: XoRuntimeContext = null;

    @Input()
    set isStorable(value: boolean) {
        if (value !== this._isStorable) {
            this._isStorable = value;
            this.updateTabBarItemList();
        }
    }

    get dataType(): XoDataType {
        return this.getModel() as XoDataType;
    }

    @Input()
    set dataType(value: XoDataType) {
        this.setModel(value);
        if (value) {
            this.refreshTabs();
        }
        this.cdr.markForCheck();
    }

    @Input()
    set detailsItem(value: XoDetailsItem) {
        if (value) {
            this.refreshTabs();
        }
        this.cdr.markForCheck();
    }

    private _isStorable = false;

    docTabUpdate: Subject<DocumentationTabData> = new BehaviorSubject(this.buildDocTabData());
    metaTabUpdate: Subject<MetaTabData> = new BehaviorSubject(this.buildMetaTabData());
    dataTypeTabUpdate: Subject<DataTypeTabData> = new BehaviorSubject(this.buildDataTypeTabData());

    readonly documentationTabItem: XcTabBarItem<DocumentTabData<DocumentationTabData>> = {
        closable: false,
        component: DocumentationTabComponent,
        name: this.i18nService.translate('pmod.datatype.type-documentation-area.documentation-label'),
        data: <DocumentTabData<DocumentationTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.docTabUpdate.asObservable()
        }
    };

    readonly metaTagsTabItem: XcTabBarItem<DocumentTabData<MetaTabData>> = {
        closable: false,
        component: MetaTabComponent,
        name: 'Meta',
        data: <DocumentTabData<MetaTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.metaTabUpdate.asObservable()
        }
    };

    readonly storableTabItem: XcTabBarItem<DocumentTabData<DataTypeTabData>> = {
        closable: false,
        component: DataTypeStorableTabComponent,
        name: 'ODS Information',
        data: <DocumentTabData<DataTypeTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.dataTypeTabUpdate.asObservable()
        }
    };

    tabBarSelection: XcTabBarItem<DocumentTabData<BaseTabData>>;
    tabBarItems: XcTabBarItem<DocumentTabData<BaseTabData>>[];

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
        this.metaTabUpdate.complete();
        this.dataTypeTabUpdate.complete();
        super.ngOnDestroy();
    }

    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    private buildDocTabData(): DocumentationTabData {
        return <DocumentationTabData> {
            documentationArea: this.dataType?.documentationArea,
            readonly: this.readonly
        };
    }

    private buildMetaTabData(): MetaTabData {
        return <MetaTabData> {
            metaTagArea: this.dataType?.metaTagArea,
            objectIdKey: '',
            objectId: '',
            readonly: this.readonly
        };
    }

    private buildDataTypeTabData(): DataTypeTabData {
        return <DataTypeTabData> {
            dataType: this.dataType,
            readonly: this.readonly
        };
    }

    private updateTabBarItemList() {
        this.tabBarItems = [this.documentationTabItem, this.metaTagsTabItem];
        if (this._isStorable) {
            this.tabBarItems.push(this.storableTabItem);
        }
        this.cdr.markForCheck();
    }

    private refreshTabs() {
        this.docTabUpdate.next(this.buildDocTabData());
        this.metaTabUpdate.next(this.buildMetaTabData());
        this.dataTypeTabUpdate.next(this.buildDataTypeTabData());
    }
}
