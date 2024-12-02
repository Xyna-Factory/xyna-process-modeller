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
import { I18nService } from '@zeta/i18n';
import { XcTabBarItem } from '@zeta/xc';

import { BehaviorSubject, Subject } from 'rxjs';

import { XoRuntimeContext } from '../../../xo/runtime-context.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { WorkflowDetailLevelService } from '../../workflow-detail-level.service';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { DatatypeTabData, DetailsTabData } from '../tabs/datatype-tab.component';
import { DataTypeBaseTabComponent } from '../tabs/datatype/datatype-base-tab.component';
import { DataTypeMetaTabComponent } from '../tabs/datatype/datatype-meta-tab.component';
import { DataTypeStorableTabComponent } from '../tabs/datatype/datatype-storable-tab.component';


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

    private _isStorable = false;

    tabUpdate: Subject<DetailsTabData> = new BehaviorSubject(this.buildDatatypeTabData());

    readonly documentationTabItem: XcTabBarItem<DatatypeTabData<DetailsTabData>> = {
        closable: false,
        component: DataTypeBaseTabComponent,
        name: this.i18nService.translate('pmod.datatype.type-documentation-area.documentation-label'),
        data: <DatatypeTabData<DetailsTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.tabUpdate.asObservable()
        }
    };

    readonly metaTagsTabItem: XcTabBarItem<DatatypeTabData<DetailsTabData>> = {
        closable: false,
        component: DataTypeMetaTabComponent,
        name: 'Meta',
        data: <DatatypeTabData<DetailsTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.tabUpdate.asObservable()
        }
    };

    readonly storableTabItem: XcTabBarItem<DatatypeTabData<DetailsTabData>> = {
        closable: false,
        component: DataTypeStorableTabComponent,
        name: 'ODS Information',
        data: <DatatypeTabData<DetailsTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.tabUpdate.asObservable()
        }
    };

    tabBarSelection: XcTabBarItem<DatatypeTabData<DetailsTabData>>;
    tabBarItems: XcTabBarItem<DatatypeTabData<DetailsTabData>>[];

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
        this.tabUpdate.complete();
        super.ngOnDestroy();
    }


    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    private buildDatatypeTabData(): DetailsTabData {
        return <DetailsTabData> {
            dataType: this.dataType,
            dataTypeRTC: this.dataTypeRTC,
            readonly: this.readonly
        };
    }


    get dataType(): XoDataType {
        return this.getModel() as XoDataType;
    }


    @Input()
    set dataType(value: XoDataType) {
        this.setModel(value);
        if (value) {
            this.tabUpdate.next(this.buildDatatypeTabData());
        }
        this.cdr.markForCheck();
    }

    private updateTabBarItemList() {
        this.tabBarItems = [this.documentationTabItem, this.metaTagsTabItem];
        if (this._isStorable) {
            this.tabBarItems.push(this.storableTabItem);
        }
        this.cdr.markForCheck();
    }
}
