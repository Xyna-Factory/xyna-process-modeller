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

import { XcTabBarItem } from '@zeta/xc';

import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoMemberVariable } from '../../../xo/member-variable.model';
import { XoRuntimeContext } from '../../../xo/runtime-context.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { MemberVariableStorableTabComponent } from '../tabs/member-variable/member-variable-storable-tab.component';
import { DatatypeTabData, VariableTabData } from '../tabs/datatype-tab.component';
import { MemberVariableBaseTabComponent } from '../tabs/member-variable/member-variable-base-tab.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { MemberVariableMetaTabComponent } from '../tabs/member-variable/member-variable-meta-tab.component';


@Component({
    selector: 'member-variable-details',
    templateUrl: './member-variable-details.component.html',
    styleUrls: ['./member-variable-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberVariableDetailsComponent extends ModellingItemComponent implements OnDestroy {

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

    tabUpdate: Subject<VariableTabData> = new BehaviorSubject(this.buildDatatypeTabData());

    readonly baseTabItem: XcTabBarItem<DatatypeTabData<VariableTabData>> = {
        closable: false,
        component: MemberVariableBaseTabComponent,
        name: 'Base',
        data: <DatatypeTabData<VariableTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.tabUpdate.asObservable()
        }
    };

    readonly metaTabItem: XcTabBarItem<DatatypeTabData<VariableTabData>> = {
        closable: false,
        component: MemberVariableMetaTabComponent,
        name: 'Meta',
        data: <DatatypeTabData<VariableTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.tabUpdate.asObservable()
        }
    };

    readonly storableTabItem: XcTabBarItem<DatatypeTabData<VariableTabData>> = {
        closable: false,
        component: MemberVariableStorableTabComponent,
        name: 'Storable',
        data: <DatatypeTabData<VariableTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            update: this.tabUpdate.asObservable()
        }
    };

    tabBarSelection: XcTabBarItem<DatatypeTabData<VariableTabData>>;
    tabBarItems: XcTabBarItem<DatatypeTabData<VariableTabData>>[];

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        private readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
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


    private buildDatatypeTabData(): VariableTabData {
        return <VariableTabData> {
            variable: this.memberVariable,
            dataTypeRTC: this.dataTypeRTC,
            readonly: this.readonly
        };
    }


    get memberVariable(): XoMemberVariable {
        return this.getModel() as XoMemberVariable;
    }


    @Input()
    set memberVariable(value: XoMemberVariable) {
        this.setModel(value);
        if (value) {
            this.baseTabItem.name = this.memberVariable?.label ?? 'Base';
            this.tabUpdate.next(this.buildDatatypeTabData());
        }
        this.cdr.markForCheck();
    }

    private updateTabBarItemList() {
        this.tabBarItems = [this.baseTabItem/*, this.metaTabItem*/];
        if (this._isStorable) {
            this.tabBarItems.push(this.storableTabItem);
        }
        this.cdr.markForCheck();
    }
}
