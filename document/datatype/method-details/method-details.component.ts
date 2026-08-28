/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
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

import { BehaviorSubject, Subject } from 'rxjs';

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { MinMaxService } from '@pmod/document/min-max.service';
import { I18nService } from '@zeta/i18n';
import { XcTabBarComponent, XcTabBarItem } from '@zeta/xc';

import { XoMethod } from '../../../xo/method.model';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { DocumentTabData, MetaTabData, MethodTabData } from '../tabs/datatype-tab.component';
import { MethodBaseTabComponent } from '../tabs/method/method-base-tab.component';
import { MethodImplementationTabComponent } from '../tabs/method/method-implementation-tab.component';
import { MetaTabComponent } from '../tabs/shared/meta-tab.component';


@Component({
    selector: 'method-details',
    templateUrl: './method-details.component.html',
    styleUrls: ['./method-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcTabBarComponent]
})
export class MethodDetailsComponent extends ModellingItemComponent implements OnDestroy {

    protected readonly i18nService = inject(I18nService);
    protected readonly cdr = inject(ChangeDetectorRef);
    private readonly minMaxService = inject(MinMaxService);

    readonly methodInput = input<XoMethod>(null, { alias: 'method' });


    methodTabUpdate: Subject<MethodTabData> = new BehaviorSubject(this.buildMethodTabData(null));
    metaTabUpdate: Subject<MetaTabData> = new BehaviorSubject(this.buildMetaTabData(null));

    readonly tabBarSelection = signal<XcTabBarItem<DocumentTabData<any>>>(null);
    readonly tabBarItems = signal<XcTabBarItem<DocumentTabData<any>>[]>([]);

    constructor() {
        super();
        effect(() => this.refreshTabs());
    }


    ngOnDestroy() {
        this.methodTabUpdate.complete();
        this.metaTabUpdate.complete();
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

    private buildMethodTabData(method: XoMethod = null): MethodTabData {
        return <MethodTabData>{
            method: method,
            readonly: this.readonly
        };
    }


    private buildMetaTabData(method: XoMethod = null): MetaTabData {
        return <MetaTabData>{
            metaTagArea: method?.metaTagArea,
            objectIdKey: 'services',
            objectId: method?.name,
            readonly: this.readonly
        };
    }

    private refreshTabs() {
        const method = this.methodInput();
        const baseTabItem: XcTabBarItem<DocumentTabData<MethodTabData>> = {
            closable: false,
            component: MethodBaseTabComponent,
            name: signal(method?.label ?? 'Base'),
            data: <DocumentTabData<MethodTabData>>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                readonly: this.readonly,
                update: this.methodTabUpdate.asObservable()
            }
        };
        const metaTabItem: XcTabBarItem<DocumentTabData<MetaTabData>> = {
            closable: false,
            component: MetaTabComponent,
            name: signal('Meta'),
            data: <DocumentTabData<MetaTabData>>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                readonly: this.readonly,
                update: this.metaTabUpdate.asObservable()
            }
        };
        const implementationTabItem: XcTabBarItem<DocumentTabData<MethodTabData>> = {
            closable: false,
            component: MethodImplementationTabComponent,
            name: this.i18nService.translateSignal('pmod.datatype.method-details.implementation'),
            data: <DocumentTabData<MethodTabData>>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                update: this.methodTabUpdate.asObservable()
            }
        };

        if (this.minMaxService.maximizedImplementation()) {
            baseTabItem.disabled = true;
            metaTabItem.disabled = true;
        }

        this.tabBarItems.set([baseTabItem, metaTabItem, implementationTabItem]);
        this.tabBarSelection.set(baseTabItem);

        if (method) {
            this.setModel(method);
            this.methodTabUpdate.next(this.buildMethodTabData(method));
            this.metaTabUpdate.next(this.buildMetaTabData(method));
        }
    }
}
