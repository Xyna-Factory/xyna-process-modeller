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
import { ChangeDetectionStrategy, Component, effect, inject, input, OnDestroy, signal } from '@angular/core';

import { XcTabBarComponent, XcTabBarItem } from '@zeta/xc';

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
    imports: [XcTabBarComponent]
})
export class MemberVariableDetailsComponent extends ModellingItemComponent implements OnDestroy {
    readonly memberVariable = input<XoMemberVariable>(null, { alias: 'memberVariable' });
    readonly dataTypeRTC = input<XoRuntimeContext>(null, { alias: 'dataTypeRTC' });
    readonly isStorable = input(false, { alias: 'isStorable' });

    memberTabUpdate: Subject<VariableTabData> = new BehaviorSubject(this.buildMemberTabData(null, null));
    metaTabUpdate: Subject<MetaTabData> = new BehaviorSubject(this.buildMetaTabData(null));

    readonly tabBarSelection = signal<XcTabBarItem<DocumentTabData<any>>>(null);
    readonly tabBarItems = signal<XcTabBarItem<DocumentTabData<any>>[]>([]);

    constructor() {
        super();
        effect(() => {
            this.setModel(this.memberVariable());
            this.refreshTabs();
        });
    }

    ngOnDestroy() {
        this.memberTabUpdate.complete();
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
    }

    private buildMemberTabData(memberVariable: XoMemberVariable = null, dataTypeRTC: XoRuntimeContext = null): VariableTabData {
        return <VariableTabData> {
            variable: memberVariable,
            dataTypeRTC: dataTypeRTC,
            readonly: this.readonly
        };
    }

    private buildMetaTabData(memberVariable: XoMemberVariable = null): MetaTabData {
        return <MetaTabData> {
            metaTagArea: memberVariable?.metaTagArea,
            objectIdKey: 'members',
            objectId: memberVariable?.name,
            readonly: this.readonly
        };
    }

    private refreshMemberTabData(memberVariable: XoMemberVariable, dataTypeRTC: XoRuntimeContext) {
        this.memberTabUpdate.next(this.buildMemberTabData(memberVariable, dataTypeRTC));
    }

    private refreshMetaTabData(memberVariable: XoMemberVariable) {
        this.metaTabUpdate.next(this.buildMetaTabData(memberVariable));
    }

    private createBaseTabItem(memberVariable: XoMemberVariable): XcTabBarItem<DocumentTabData<VariableTabData>> {
        return {
            closable: false,
            component: MemberVariableBaseTabComponent,
            name: signal(memberVariable?.label ?? 'Base'),
            data: <DocumentTabData<VariableTabData>>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                readonly: this.readonly,
                update: this.memberTabUpdate.asObservable()
            }
        };
    }

    private createMetaTabItem(): XcTabBarItem<DocumentTabData<MetaTabData>> {
        return {
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
    }

    private createStorableTabItem(): XcTabBarItem<DocumentTabData<VariableTabData>> {
        return {
            closable: false,
            component: MemberVariableStorableTabComponent,
            name: signal('Storable'),
            data: <DocumentTabData<VariableTabData>>{
                documentModel: this.documentModel,
                performAction: this.performAction.bind(this),
                readonly: this.readonly,
                update: this.memberTabUpdate.asObservable()
            }
        };
    }

    private refreshTabs() {
        const memberVariable = this.memberVariable();
        const dataTypeRTC = this.dataTypeRTC();

        if (!memberVariable) {
            this.tabBarItems.set([]);
            this.tabBarSelection.set(null);
            return;
        }

        const baseTabItem = this.createBaseTabItem(memberVariable);
        const metaTabItem = this.createMetaTabItem();
        const items = [baseTabItem, metaTabItem];
        if (this.isStorable()) {
            items.push(this.createStorableTabItem());
        }
        this.tabBarItems.set(items);
        this.tabBarSelection.set(baseTabItem);
        this.refreshMemberTabData(memberVariable, dataTypeRTC);
        this.refreshMetaTabData(memberVariable);
    }
}
