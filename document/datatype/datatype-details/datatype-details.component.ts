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

import { BehaviorSubject, combineLatest, map, Observable, of, Subject, Subscription } from 'rxjs';

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { PluginService } from '@pmod/document/plugin.service';
import { XoDataType } from '@pmod/xo/data-type.model';
import { XoDetailsItem } from '@pmod/xo/details-item.model';
import { I18nService } from '@zeta/i18n';
import { XcTabBarComponent, XcTabBarItem } from '@zeta/xc';
import { XoBaseDefinition, XoDefinitionBundle } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';

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
    imports: [XcTabBarComponent]
})
export class DataTypeDetailsComponent extends ModellingItemComponent implements OnDestroy {

    protected readonly pluginService = inject(PluginService);
    protected readonly i18nService = inject(I18nService);
    protected readonly cdr = inject(ChangeDetectorRef);

    readonly dataTypeRTC = input<XoRuntimeContext>(null, { alias: 'dataTypeRTC' });
    readonly isStorable = input(false, { alias: 'isStorable' });
    readonly dataTypeInput = input<XoDataType>(null, { alias: 'dataType' });
    readonly detailsItem = input<XoDetailsItem>(null, { alias: 'detailsItem' });

    private pluginTabsSubscription?: Subscription;

    tabUpdate: Subject<XoDataType> = new BehaviorSubject(this.dataTypeInput());

    readonly documentationTabItem: XcTabBarItem<DocumentTabData<DocumentationTabData>> = {
        closable: false,
        component: DocumentationTabComponent,
        name: this.i18nService.translateSignal('pmod.datatype.type-documentation-area.documentation-label'),
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
        name: signal('Meta'),
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
        name: signal('ODS Information'),
        data: <DocumentTabData<XoDataType>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            readonly: this.readonly,
            update: this.tabUpdate.asObservable()
        }
    };

    readonly tabBarSelection = signal<XcTabBarItem<DocumentTabData<any>>>(null);
    readonly tabBarItems = signal<XcTabBarItem<DocumentTabData<any>>[]>([]);

    constructor() {
        super();
        effect(() => this.refreshTabs());
    }

    ngOnDestroy() {
        this.tabUpdate.complete();
        this.pluginTabsSubscription?.unsubscribe();
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
        this.pluginTabsSubscription?.unsubscribe();
        this.pluginTabsSubscription = undefined;

        const tabItems: XcTabBarItem[] = [this.documentationTabItem, this.metaTagsTabItem];
        if (this.isStorable()) {
            tabItems.push(this.storableTabItem);
        }
        const dataType = this.dataTypeInput();
        this.tabBarItems.set(tabItems);
        if (dataType?.plugin?.guiDefiningWorkflow) {
            this.pluginTabsSubscription = combineLatest(
                dataType.plugin.guiDefiningWorkflow.data.map(
                    value => this.pluginService.getFromCacheOrCallWorkflow(value)
                )
            ).subscribe(bundles => {
                const pluginItems = [...tabItems];
                bundles.forEach(bundle => {
                    bundle.data.push(dataType.plugin.context);
                    pluginItems.push(this.createPluginTabItem(bundle, (bundle.definition as XoBaseDefinition).label));
                });
                this.tabBarItems.set(pluginItems);
                this.tabBarSelection.set(this.documentationTabItem);
                this.cdr.markForCheck();
            });
        } else {
            this.tabBarSelection.set(this.documentationTabItem);
        }
        this.cdr.markForCheck();
    }

    private refreshTabs() {
        const dataType = this.dataTypeInput();
        this.detailsItem();
        this.dataTypeRTC();

        if (dataType) {
            this.setModel(dataType);
            this.tabUpdate.next(dataType);
        }
        this.tabBarSelection.set(this.documentationTabItem);
        this.updateTabBarItemList();
    }

    private createPluginTabItem(bundle: XoDefinitionBundle, tabName: string): XcTabBarItem<PluginTabData> {
        return <XcTabBarItem<PluginTabData>> {
            closable: false,
            component: DataTypePluginTabComponent,
            name: signal(tabName || 'Plugin'),
            data: <PluginTabData>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                update: of() as Observable<XoDataType>,
                bundle: bundle
            }
        };
    }
}
