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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnDestroy } from '@angular/core';

import { XcTabBarItem } from '@zeta/xc';

import { BehaviorSubject, Subject } from 'rxjs';

import { XoMemberVariable } from '../../../xo/member-variable.model';
import { XoRuntimeContext } from '../../../xo/runtime-context.model';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { DocumentTabData, MetaTabData, VariableTabData } from '../tabs/datatype-tab.component';
import { MemberVariableBaseTabComponent } from '../tabs/member-variable/member-variable-base-tab.component';
import { MemberVariableStorableTabComponent } from '../tabs/member-variable/member-variable-storable-tab.component';
import { MetaTabComponent } from '../tabs/shared/meta-tab.component';


@Component({
    selector: 'member-variable-details',
    templateUrl: './member-variable-details.component.html',
    styleUrls: ['./member-variable-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class MemberVariableDetailsComponent extends ModellingItemComponent implements OnDestroy {

    protected readonly cdr = inject(ChangeDetectorRef);

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
    get memberVariable(): XoMemberVariable {
        return this.getModel() as XoMemberVariable;
    }

    @Input()
    set memberVariable(value: XoMemberVariable) {
        this.setModel(value);
        if (value) {
            this.baseTabItem.name = this.memberVariable?.label ?? 'Base';
            this.memberTabUpdate.next(this.buildMemberTabData());
            this.metaTabUpdate.next(this.buildMetaTabData());
        }
        this.cdr.markForCheck();
    }

    memberTabUpdate: Subject<VariableTabData> = new BehaviorSubject(this.buildMemberTabData());
    metaTabUpdate: Subject<MetaTabData> = new BehaviorSubject(this.buildMetaTabData());

    readonly baseTabItem: XcTabBarItem<DocumentTabData<VariableTabData>> = {
        closable: false,
        component: MemberVariableBaseTabComponent,
        name: 'Base',
        data: <DocumentTabData<VariableTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            readonly: this.readonly,
            update: this.memberTabUpdate.asObservable()
        }
    };

    readonly metaTabItem: XcTabBarItem<DocumentTabData<MetaTabData>> = {
        closable: false,
        component: MetaTabComponent,
        name: 'Meta',
        data: <DocumentTabData<MetaTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            readonly: this.readonly,
            update: this.metaTabUpdate.asObservable()
        }
    };

    readonly storableTabItem: XcTabBarItem<DocumentTabData<VariableTabData>> = {
        closable: false,
        component: MemberVariableStorableTabComponent,
        name: 'Storable',
        data: <DocumentTabData<VariableTabData>>{
            documentModel: this.documentModel,
            performAction: this.performAction.bind(this),
            readonly: this.readonly,
            update: this.memberTabUpdate.asObservable()
        }
    };

    tabBarSelection: XcTabBarItem<DocumentTabData<any>>;
    tabBarItems: XcTabBarItem<DocumentTabData<any>>[];

    constructor() {
        super();
        this.tabBarSelection = this.baseTabItem;
        this.updateTabBarItemList();
    }

    ngOnDestroy() {
        this.memberTabUpdate.complete();
        this.metaTabUpdate.complete();
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


    private buildMemberTabData(): VariableTabData {
        return <VariableTabData> {
            variable: this.memberVariable,
            dataTypeRTC: this.dataTypeRTC,
            readonly: this.readonly
        };
    }

    private buildMetaTabData(): MetaTabData {
        return <MetaTabData> {
            metaTagArea: this.memberVariable?.metaTagArea,
            objectIdKey: 'members',
            objectId: this.memberVariable?.name,
            readonly: this.readonly
        };
    }

    private updateTabBarItemList() {
        this.tabBarItems = [this.baseTabItem, this.metaTabItem];
        if (this._isStorable) {
            this.tabBarItems.push(this.storableTabItem);
        }
        this.cdr.markForCheck();
    }
}
