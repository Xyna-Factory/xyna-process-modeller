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
import { DatatypeTabData, MethodTabData } from '../tabs/datatype-tab.component';
import { MethodBaseTabComponent } from '../tabs/method/method-base-tab.component';
import { MethodImplementationTabComponent } from '../tabs/method/method-implementation-tab.component';
import { MethodMetaTabComponent } from '../tabs/method/method-meta-tab.component';


@Component({
    selector: 'method-details',
    templateUrl: './method-details.component.html',
    styleUrls: ['./method-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MethodDetailsComponent extends ModellingItemComponent implements OnDestroy {

    tabUpdate: Subject<MethodTabData> = new BehaviorSubject(this.buildDatatypeTabData());

    readonly baseTabItem: XcTabBarItem<DatatypeTabData<MethodTabData>>;

    readonly metaTabItem: XcTabBarItem<DatatypeTabData<MethodTabData>>;

    readonly implementationTabItem: XcTabBarItem<DatatypeTabData<MethodTabData>>;


    tabBarSelection: XcTabBarItem<DatatypeTabData<MethodTabData>>;
    tabBarItems: XcTabBarItem<DatatypeTabData<MethodTabData>>[];


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

        this.baseTabItem = {
            closable: false,
            component: MethodBaseTabComponent,
            name: 'Base',
            data: <DatatypeTabData<MethodTabData>>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                update: this.tabUpdate.asObservable()
            }
        };

        this.metaTabItem = {
            closable: false,
            component: MethodMetaTabComponent,
            name: 'Meta',
            data: <DatatypeTabData<MethodTabData>>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                update: this.tabUpdate.asObservable()
            }
        };

        this.implementationTabItem = {
            closable: false,
            component: MethodImplementationTabComponent,
            name: this.i18nService.translate('pmod.datatype.method-details.implementation'),
            data: <DatatypeTabData<MethodTabData>>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                update: this.tabUpdate.asObservable()
            }
        };

        this.tabBarSelection = this.baseTabItem;
        this.updateTabBarItemList();
    }


    ngOnDestroy() {
        this.tabUpdate.complete();
        super.ngOnDestroy();
    }


    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    get method(): XoMethod {
        return this.getModel() as XoMethod;
    }


    @Input()
    set method(value: XoMethod) {
        this.setModel(value);
        if (value) {
            this.baseTabItem.name = this.method?.label ?? 'Base';
            this.tabUpdate.next(this.buildDatatypeTabData());
        }
        this.cdr.markForCheck();
    }


    private buildDatatypeTabData(): MethodTabData {
        return <MethodTabData>{
            method: this.method,
            readonly: this.readonly
        };
    }


    private updateTabBarItemList() {
        this.tabBarItems = [this.baseTabItem, this.metaTabItem, this.implementationTabItem];
        this.cdr.markForCheck();
    }
}
