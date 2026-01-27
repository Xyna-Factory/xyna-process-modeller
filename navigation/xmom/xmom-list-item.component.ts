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
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

import { WorkflowTesterData, WorkflowTesterDialogComponent } from '@fman/workflow-tester/workflow-tester-dialog.component';
import { FullQualifiedName } from '@zeta/api';
import { coerceBoolean } from '@zeta/base';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcMenuItem } from '@zeta/xc';

import { filter } from 'rxjs/operators';

import { XmomObjectType } from '../../api/xmom-types';
import { DocumentService } from '../../document/document.service';
import { XoData } from '../../xo/data.model';
import { XoDynamicMethodInvocation } from '../../xo/dynamic-method-invocation.model';
import { XoException } from '../../xo/exception.model';
import { XoFactoryItem } from '../../xo/factory-item.model';
import { XoMethodInvocation } from '../../xo/method-invocation.model';
import { XoStaticMethodInvocation } from '../../xo/static-method-invocation.model';
import { XoWorkflowInvocation } from '../../xo/workflow-invocation.model';
import { XoWorkflow } from '../../xo/workflow.model';
import { XoXmomItem } from '../../xo/xmom-item.model';
import { XcModule } from '../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../zeta/i18n/i18n.module';


@Component({
    selector: 'xfm-mod-nav-xmomlistitem',
    templateUrl: './xmom-list-item.component.html',
    styleUrls: ['./xmom-list-item.component.scss'],
    imports: [XcModule, I18nModule]
})
export class XMOMListItemComponent {

    private _xmomItem: XoXmomItem | XoFactoryItem;
    private _xmomIconName: string;
    private _path = '';
    private _showFQN = false;
    readonly writableMenuItems: XcMenuItem[] = [];
    readonly readonlyMenuItems: XcMenuItem[] = [];

    @Output()
    readonly menuOpened = new EventEmitter<XoXmomItem>();

    @Output()
    readonly menuClosed = new EventEmitter<XoXmomItem>();


    constructor(
        private readonly i18n: I18nService,
        private readonly dialogService: XcDialogService,
        private readonly documentService: DocumentService
    ) {
        this.writableMenuItems = [
            <XcMenuItem>{
                name: 'Open',
                icon: 'file',
                translate: true,
                click: () => this.selectXmomItem()
            },
            <XcMenuItem>{
                name: 'Test Workflow...',
                icon: 'sp-launcher',
                iconStyle: 'modeller',
                translate: true,
                visible: () => this.isWorkflow,
                click: () => this.testWorkflow()
            },
            <XcMenuItem>{
                name: 'Move/Rename...',
                icon: 'edit',
                translate: true,
                click: () => this.refactorXmomItem()
            },
            <XcMenuItem>{
                name: 'Replace...',
                icon: 'edit',
                translate: true,
                visible: () => this.isDatatype,
                click: () => this.replace()
            },
            <XcMenuItem>{
                name: 'Delete from XMOM...',
                icon: 'delete',
                translate: true,
                click: () => this.deleteXmomItem(),
                visible: () => !this.isCodedService && !this.isInstanceService
            }
        ];
        this.readonlyMenuItems = this.writableMenuItems.slice(0, 2);
    }


    private getIconNameFromType(): string {
        // Workflows
        if (this.xmomItem instanceof XoWorkflowInvocation || this.xmomItem.type === XmomObjectType.Workflow) {
            return 'mini-workflow';
        }
        // DataTypes
        if (this.xmomItem instanceof XoData || this.xmomItem.type === XmomObjectType.DataType) {
            return 'mini-datatype';
        }
        // ExceptionTypes
        if (this.xmomItem instanceof XoException || this.xmomItem.type === XmomObjectType.ExceptionType) {
            return 'mini-catch';
        }
        // Coded Services
        if (this.xmomItem instanceof XoStaticMethodInvocation || this.xmomItem.type === XmomObjectType.CodedService) {
            return 'mini-workflow'; // TODO - no official icon
        }
        // Instance Services
        if (this.xmomItem instanceof XoDynamicMethodInvocation || this.xmomItem.type === XmomObjectType.InstanceService) {
            return 'mini-workflow'; // TODO - no official icon
        }
        // Service Groups
        // if (this.xmomObject instanceof XoServiceGroup) {     // TODO needs Service Group Icon
        //     return 'mini-datatype';                          // TODO remove workaround in html and scss
        // }
    }


    /**
     * Factory items do have a rtc and fqn but they refer to the factory item datatype itself.
     * Thus, when deleting or refactoring an xmom item it has to be converted to a real xmom item,
     * by directly setting fqn and rtc.
     */
    private getXmomItem(): XoXmomItem {
        if (this.xmomItem instanceof XoXmomItem) {
            return this.xmomItem;
        }
        const xmomItem = new XoXmomItem();
        xmomItem.fqn = FullQualifiedName.decode(this.xmomItem.$fqn);
        xmomItem.rtc = this.xmomItem.$rtc.runtimeContext();
        xmomItem.type = this.xmomItem.type as XmomObjectType;
        return xmomItem;
    }


    @Input('xmom-item')
    set xmomItem(value: XoXmomItem | XoFactoryItem) {
        this._xmomItem = value;
        this._xmomIconName = this.getIconNameFromType();
        if (this.xmomItem instanceof XoXmomItem || this.isFactoryItem) {
            this._path = this.xmomItem.$fqn.substr(0, this.xmomItem.$fqn.lastIndexOf('.'));
        }
    }


    get xmomItem(): XoXmomItem | XoFactoryItem {
        return this._xmomItem;
    }


    @Input('show-fqn')
    set showFQN(value: boolean) {
        this._showFQN = coerceBoolean(value);
    }


    get showFQN(): boolean {
        return this._showFQN;
    }


    get isDuplicate(): boolean {
        return this.xmomItem instanceof XoXmomItem
            ? this.xmomItem.ambigue
            : false;
    }


    get xmomIconName(): string {
        return this._xmomIconName;
    }


    get xmomPath(): string {
        return this._path;
    }


    get xmomRTC(): string {
        return this.xmomItem instanceof XoXmomItem
            ? this.xmomItem.toRtc().uniqueKey
            : '';
    }


    get parentContainer(): string {
        return this.xmomItem instanceof XoMethodInvocation
            ? this.xmomItem.service
            : '';
    }


    get isReadonly(): boolean {
        return this.xmomItem instanceof XoXmomItem
            ? this.xmomItem.readonly
            : false;
    }


    get menuItems(): XcMenuItem[] {
        return this.isReadonly
            ? this.readonlyMenuItems
            : this.writableMenuItems;
    }


    get showMenu(): boolean {
        return this.menuItems.length > 0;
    }


    get type(): XmomObjectType {
        return this.xmomItem?.type as XmomObjectType;
    }


    get isWorkflow(): boolean {
        return this.type === XmomObjectType.Workflow;
    }


    get isDatatype(): boolean {
        return this.type === XmomObjectType.DataType;
    }


    get isInstanceService(): boolean {
        return this.type === XmomObjectType.InstanceService;
    }


    get isExceptionType(): boolean {
        return this.type === XmomObjectType.ExceptionType;
    }


    get isServiceGroup(): boolean {
        return this.type === XmomObjectType.ServiceGroup;
    }


    get isCodedService(): boolean {
        return this.type === XmomObjectType.CodedService;
    }


    get isFactoryItem(): boolean {
        return this.xmomItem instanceof XoFactoryItem;
    }


    @HostListener('dblclick')
    selectXmomItem() {
        const rtc = this.xmomItem.toRtc();
        const fqn = this.xmomItem.toFqn();
        this.documentService.loadDocument(rtc, fqn, this.type);
    }


    deleteXmomItem() {
        const title = this.i18n.translate('pmod.delete-xmom-header', {key: '$0', value: this.xmomPath + '.' + this.xmomItem.label});
        const message = this.i18n.translate('Really delete $0 from XMOM?', {key: '$0', value: this.xmomPath + '.' + this.xmomItem.label});
        this.dialogService.confirm(title, message)
            .afterDismiss()
            .pipe(filter(result => result))
            .subscribe(() => this.documentService.deleteItem(this.getXmomItem()));
    }


    refactorXmomItem() {
        this.documentService.refactorItem(this.getXmomItem()).subscribe();
    }

    replace() {
        this.documentService.replace(this.getXmomItem()).subscribe();
    }

    testWorkflow() {
        if (this.isWorkflow) {
            const workflow = this.xmomItem as XoWorkflow;
            const fqn = workflow.toFqn();
            const rtc = (workflow.$rtc ?? workflow.evaluatedRtc).runtimeContext();
            this.dialogService.custom(
                WorkflowTesterDialogComponent,
                <WorkflowTesterData>{
                    runtimeContext: rtc,
                    orderType: fqn.encode()
                }
            ).afterDismiss().subscribe();
        }
    }
}
