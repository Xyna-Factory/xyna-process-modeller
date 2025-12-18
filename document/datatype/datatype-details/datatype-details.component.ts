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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnDestroy } from '@angular/core';

import { PluginService } from '@pmod/document/plugin.service';
import { XoDataType } from '@pmod/xo/data-type.model';
import { XoDetailsItem } from '@pmod/xo/details-item.model';
import { I18nService } from '@zeta/i18n';
import { XcTabBarItem } from '@zeta/xc';
import { XoBaseDefinition, XoDefinitionBundle } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';

import { BehaviorSubject, combineLatest, map, Observable, of, Subject } from 'rxjs';

import { XoRuntimeContext } from '../../../xo/runtime-context.model';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { DocumentationTabData, DocumentTabData, MetaTabData, PluginTabData } from '../tabs/datatype-tab.component';
import { DataTypePluginTabComponent } from '../tabs/datatype/datatype-plugin-tab.component';
import { DataTypeStorableTabComponent } from '../tabs/datatype/datatype-storable-tab.component';
import { DocumentationTabComponent } from '../tabs/shared/documentation-tab.component';
import { MetaTabComponent } from '../tabs/shared/meta-tab.component';


@Component({
    selector: 'datatype-details',
    templateUrl: './datatype-details.component.html',
    styleUrls: ['./datatype-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DataTypeDetailsComponent extends ModellingItemComponent implements OnDestroy {

    protected readonly pluginService = inject(PluginService);
    protected readonly i18nService = inject(I18nService);
    protected readonly cdr = inject(ChangeDetectorRef);

    @Input()
    dataTypeRTC: XoRuntimeContext = null;

    @Input()
    set isStorable(value: boolean) {
        if (value !== this._isStorable) {
            this._isStorable = value;
        }
    }

    get dataType(): XoDataType {
        return this.getModel() as XoDataType;
    }

    @Input()
    set dataType(value: XoDataType) {
        this.setModel(value);
        if (value) {
            this.updateTabBarItemList();
            this.refreshTabs();
        }
    }

    @Input()
    set detailsItem(value: XoDetailsItem) {
        if (value) {
            this.refreshTabs();
        }
        this.cdr.markForCheck();
    }

    private _isStorable = false;

    tabUpdate: Subject<XoDataType> = new BehaviorSubject(this.dataType);

    readonly documentationTabItem: XcTabBarItem<DocumentTabData<DocumentationTabData>> = {
        closable: false,
        component: DocumentationTabComponent,
        name: this.i18nService.translate('pmod.datatype.type-documentation-area.documentation-label'),
        data: <DocumentTabData<DocumentationTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            readonly: this.readonly,
            update: this.tabUpdate.asObservable().pipe(map(dataType => this.buildDocTabData(dataType)))
        }
    };

    readonly metaTagsTabItem: XcTabBarItem<DocumentTabData<MetaTabData>> = {
        closable: false,
        component: MetaTabComponent,
        name: 'Meta',
        data: <DocumentTabData<MetaTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            readonly: this.readonly,
            update: this.tabUpdate.asObservable().pipe(map(dataType => this.buildMetaTabData(dataType)))
        }
    };

    readonly storableTabItem: XcTabBarItem<DocumentTabData<XoDataType>> = {
        closable: false,
        component: DataTypeStorableTabComponent,
        name: 'ODS Information',
        data: <DocumentTabData<XoDataType>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            readonly: this.readonly,
            update: this.tabUpdate.asObservable()
        }
    };

    tabBarSelection: XcTabBarItem<DocumentTabData<any>>;
    tabBarItems: XcTabBarItem<DocumentTabData<any>>[];

    constructor() {
        super();
        this.tabBarSelection = this.documentationTabItem;
    }

    ngOnDestroy() {
        this.tabUpdate.complete();
        super.ngOnDestroy();
    }

    afterDocumentModelSet() {
        super.afterDocumentModelSet();
        this.tabBarItems.forEach(tabitem => {
            tabitem.data.documentModel = this.documentModel;
            tabitem.data.readonly = this.readonly;
        });
    }

    protected lockedChanged() {
        this.tabBarItems.forEach(tabitem => {
            tabitem.data.readonly = this.readonly;
        });
        this.cdr.markForCheck();
    }


    private buildDocTabData(dataType: XoDataType): DocumentationTabData {
        return <DocumentationTabData>{
            documentationArea: dataType.documentationArea
        };
    }

    private buildMetaTabData(dataType: XoDataType): MetaTabData {
        return <MetaTabData>{
            metaTagArea: dataType.metaTagArea,
            objectIdKey: '',
            objectId: ''
        };
    }

    private updateTabBarItemList() {
        this.tabBarItems = [this.documentationTabItem, this.metaTagsTabItem];
        if (this._isStorable) {
            this.tabBarItems.push(this.storableTabItem);
        }
        if (this.dataType.plugin?.guiDefiningWorkflow) {
            combineLatest(
                this.dataType.plugin?.guiDefiningWorkflow.data.map(
                    value => this.pluginService.getFromCacheOrCallWorkflow(value)
                )
            ).subscribe(bundles => {
                bundles.forEach(bundle => {
                    bundle.data.push(this.dataType.plugin.context);
                    this.tabBarItems.push(this.createPluginTabItem(bundle, (bundle.definition as XoBaseDefinition).label));
                });
            });
        }
        this.cdr.markForCheck();
    }

    private refreshTabs() {
        this.tabUpdate.next(this.dataType);
    }

    private createPluginTabItem(bundle: XoDefinitionBundle, tabName: string): XcTabBarItem<PluginTabData> {
        return <XcTabBarItem<PluginTabData>> {
            closable: false,
            component: DataTypePluginTabComponent,
            name: tabName || 'Plugin',
            data: <PluginTabData>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                update: of() as Observable<XoDataType>,
                bundle: bundle
            }
        };
    }
}
