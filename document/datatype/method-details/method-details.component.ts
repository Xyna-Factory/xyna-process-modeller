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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, Input, OnDestroy, Optional } from '@angular/core';

import { I18nService } from '@zeta/i18n';
import { XcTabBarItem } from '@zeta/xc';

import { BehaviorSubject, Subject } from 'rxjs';

import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoMethod } from '../../../xo/method.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { BaseTabData, DocumentTabData, MetaTabData, MethodTabData } from '../tabs/datatype-tab.component';
import { MethodBaseTabComponent } from '../tabs/method/method-base-tab.component';
import { MethodImplementationTabComponent } from '../tabs/method/method-implementation-tab.component';
import { MetaTabComponent } from '../tabs/shared/meta-tab.component';


@Component({
    selector: 'method-details',
    templateUrl: './method-details.component.html',
    styleUrls: ['./method-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MethodDetailsComponent extends ModellingItemComponent implements OnDestroy {

    get method(): XoMethod {
        return this.getModel() as XoMethod;
    }

    @Input()
    set method(value: XoMethod) {
        this.setModel(value);
        if (value) {
            this.baseTabItem.name = this.method?.label ?? 'Base';
            this.methodTabUpdate.next(this.buildMethodTabData());
            this.metaTabUpdate.next(this.buildMetaTabData());
        }
        this.cdr.markForCheck();
    }

    methodTabUpdate: Subject<MethodTabData> = new BehaviorSubject(this.buildMethodTabData());
    metaTabUpdate: Subject<MetaTabData> = new BehaviorSubject(this.buildMetaTabData());

    readonly baseTabItem: XcTabBarItem<DocumentTabData<MethodTabData>> = {
        closable: false,
        component: MethodBaseTabComponent,
        name: 'Base',
        data: <DocumentTabData<MethodTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.methodTabUpdate.asObservable()
        }
    };

    readonly metaTabItem: XcTabBarItem<DocumentTabData<MetaTabData>> = {
        closable: false,
        component: MetaTabComponent,
        name: 'Meta',
        data: <DocumentTabData<MetaTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.metaTabUpdate.asObservable()
        }
    };

    readonly implementationTabItem: XcTabBarItem<DocumentTabData<MethodTabData>> = {
        closable: false,
        component: MethodImplementationTabComponent,
        name: this.i18nService.translate('pmod.datatype.method-details.implementation'),
        data: <DocumentTabData<MethodTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.methodTabUpdate.asObservable()
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
        this.tabBarSelection = this.baseTabItem;
        this.updateTabBarItemList();
    }


    ngOnDestroy() {
        this.methodTabUpdate.complete();
        this.metaTabUpdate.complete();
        super.ngOnDestroy();
    }


    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    private buildMethodTabData(): MethodTabData {
        return <MethodTabData> {
            method: this.method,
            readonly: this.readonly
        };
    }

    private buildMetaTabData(): MetaTabData {
        return <MetaTabData> {
            metaTagArea: this.method?.metaTagArea,
            objectIdKey: 'services',
            objectId: this.method?.name,
            readonly: this.readonly
        };
    }

    private updateTabBarItemList() {
        this.tabBarItems = [this.baseTabItem, this.metaTabItem, this.implementationTabItem];
        this.cdr.markForCheck();
    }
}
