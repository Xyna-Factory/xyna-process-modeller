/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
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
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';

import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcMenuItem } from '@zeta/xc';

import { merge, of, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { XmomObjectType } from '../api/xmom-types';
import { DocumentService } from '../document/document.service';
import { TypeDocumentModel } from '../document/model/type-document.model';
import { WorkflowDocumentModel } from '../document/model/workflow-document.model';
import { SelectionService } from '../document/selection.service';
import { XoConditionalBranching } from '../xo/conditional-branching.model';
import { XoConditionalChoice } from '../xo/conditional-choice.model';
import { XoData } from '../xo/data.model';
import { XoInvocation } from '../xo/invocation.model';
import { XoMapping } from '../xo/mapping.model';
import { XoModellingItem } from '../xo/modelling-item.model';
import { XoQuery } from '../xo/query.model';
import { XoRetry } from '../xo/retry.model';
import { XoTemplate } from '../xo/template.model';
import { XoTypeChoice } from '../xo/type-choice.model';
import { XoWorkflowInvocation } from '../xo/workflow-invocation.model';


export interface ToolbarButtonDescription {
    name: string;
    tooltip: string;
    iconName: string;
    iconStyle?: string;
    menuItems?: XcMenuItem[];
    xmomItem?: XoModellingItem;
    isDisabled?: (documentService: DocumentService) => boolean;
    isVisible?: (documentService: DocumentService) => boolean;
    isBusy?: (documentService: DocumentService) => boolean;
}

/** @description 'activeButton' can be set as default state of the group. The default state is the first item in the group. */
export interface ToolbarButtonDescriptionGroup {
    buttons: ToolbarButtonDescription[];
    activeButton?: ToolbarButtonDescription;
}

/** A ToolbarItem can be a group of items or one item based on wether the property 'buttons' exists*/
export type ToolbarItem = ToolbarButtonDescription | ToolbarButtonDescriptionGroup;


@Component({
    selector: 'xfm-mod-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent implements AfterViewInit, OnDestroy {

    private static readonly BUTTON_NAME_NEW = 'new';
    private static readonly BUTTON_NAME_SAVE = 'save';
    private static readonly BUTTON_NAME_SAVE_AS = 'save as';
    private static readonly BUTTON_NAME_DEPLOY = 'deploy';
    private static readonly BUTTON_NAME_DEPLOY_AS = 'deploy as';
    private static readonly BUTTON_NAME_PRINT = 'print';

    private static readonly BUTTON_NAME_SERVICE = 'Service';
    private static readonly BUTTON_NAME_PARAMETER = 'Parameter';
    private static readonly BUTTON_NAME_MAPPING = 'Mapping';
    private static readonly BUTTON_NAME_TYPE_CHOICE = 'Type Choice';
    private static readonly BUTTON_NAME_CONDITIONAL_CHOICE = 'Conditional Choice';
    private static readonly BUTTON_NAME_CONDITIONAL_BRANCHING = 'Conditional Branching';
    private static readonly BUTTON_NAME_WAIT = 'Wait';
    private static readonly BUTTON_NAME_AWAIT = 'Await';
    private static readonly BUTTON_NAME_NOTIFY = 'Notify';
    private static readonly BUTTON_NAME_MI = 'Manual Interaction';
    // private static readonly BUTTON_NAME_OPERATOR = 'Operator';
    private static readonly BUTTON_NAME_THROW = 'Throw';
    private static readonly BUTTON_NAME_RETRY = 'Retry';
    private static readonly BUTTON_NAME_TEMPLATE = 'Template';
    private static readonly BUTTON_NAME_BEGIN_DOCUMENT = 'Begin Document';
    private static readonly BUTTON_NAME_RETRIEVE_DOCUMENT = 'Retrieve Document';
    private static readonly BUTTON_NAME_END_DOCUMENT = 'End Document';
    private static readonly BUTTON_NAME_QUERY = 'Query';
    private static readonly BUTTON_NAME_STORE = 'Store';
    private static readonly BUTTON_NAME_DELETE = 'Delete';
    // private static readonly BUTTON_NAME_WORKFLOW_NOTE = 'Workflow Note';

    private static readonly BUTTON_NAME_MEMBER_VARIABLE = 'Member Variable';
    private static readonly BUTTON_NAME_INSTANCE_SERVICE = 'Instance Service';
    // private static readonly BUTTON_NAME_TYPE_NOTE = 'Type Note';

    private static readonly BUTTON_NAME_DOWNLOAD_TEMPLATE = 'Download Template';

    private static readonly WorkflowMenuItem: XcMenuItem = { name: 'Workflow', icon: 'mini-workflow', iconStyle: 'modeller' };
    private static readonly DataTypeMenuItem: XcMenuItem = { name: 'Data Type', icon: 'mini-datatype', iconStyle: 'modeller' };
    private static readonly ExceptionTypeMenuItem: XcMenuItem = { name: 'Exception Type', icon: 'mini-catch', iconStyle: 'modeller' };
    private static readonly ServiceGroupMenuItem: XcMenuItem = { name: 'Service Group', icon: 'mini-workflow', iconStyle: 'modeller' };


    private static readonly CommonDocumentButtonDescriptions: ToolbarButtonDescription[] = [
        {
            name: ToolbarComponent.BUTTON_NAME_NEW,
            tooltip: 'new',
            iconName: 'tb-newfile',
            isDisabled: ds => !ds.xmomService.runtimeContext,
            menuItems: [
                ToolbarComponent.WorkflowMenuItem,
                ToolbarComponent.DataTypeMenuItem,
                ToolbarComponent.ExceptionTypeMenuItem,
                ToolbarComponent.ServiceGroupMenuItem
            ]
        }
    ];


    private static readonly WorkflowDocumentButtonDescriptions: ToolbarButtonDescription[] = [
        ...ToolbarComponent.CommonDocumentButtonDescriptions,
        {
            name: ToolbarComponent.BUTTON_NAME_SAVE,
            tooltip: 'save',
            iconName: 'tb-save',
            isDisabled: ds => ds.isSelectedDocumentSaving || ds.selectedDocument.isLocked,
            isBusy: ds => ds.isSelectedDocumentSaving
        },
        {
            name: ToolbarComponent.BUTTON_NAME_SAVE_AS,
            tooltip: 'save-as',
            iconName: 'tb-save',
            // save as is only allowed within the same RTC (PMOD-643)
            isDisabled: ds => ds.isSelectedDocumentSaving || ds.selectedDocument.lockInfo.readonly || ds.selectedDocument.lockInfo.rtcLock,
            isBusy: ds => ds.isSelectedDocumentSaving
        },
        {
            name: ToolbarComponent.BUTTON_NAME_DEPLOY,
            tooltip: 'deploy',
            iconName: 'tb-deploy',
            isDisabled: ds => ds.isSelectedDocumentDeploying || ds.isSelectedDocumentSaving || ds.selectedDocument.isLocked,
            isBusy: ds => ds.isSelectedDocumentDeploying
        },
        {
            name: ToolbarComponent.BUTTON_NAME_PRINT,
            tooltip: 'print',
            iconName: 'tb-print'
        }
    ];


    private static readonly TypeDocumentButtonDescriptions: ToolbarButtonDescription[] = [
        ...ToolbarComponent.CommonDocumentButtonDescriptions,
        {
            name: ToolbarComponent.BUTTON_NAME_DEPLOY,
            tooltip: 'deploy',
            iconName: 'tb-deploy',
            isDisabled: ds => ds.isSelectedDocumentDeploying || ds.selectedDocument.isLocked,
            isBusy: ds => ds.isSelectedDocumentDeploying
        },
        {
            name: ToolbarComponent.BUTTON_NAME_DEPLOY_AS,
            tooltip: 'deploy-as',
            iconName: 'tb-deploy',
            // deploy as is only allowed within the same RTC (PMOD-643)
            isDisabled: ds => ds.isSelectedDocumentDeploying || ds.selectedDocument.lockInfo.readonly || ds.selectedDocument.lockInfo.rtcLock,
            isBusy: ds => ds.isSelectedDocumentDeploying
        },
        {
            name: ToolbarComponent.BUTTON_NAME_DOWNLOAD_TEMPLATE,
            tooltip: 'download-template',
            iconName: 'tb-template',
            isDisabled: ds => (ds.selectedDocument && !ds.selectedDocument.item.saved) || ds.isSelectedDocumentDownloading,
            isVisible: ds => (ds.selectedDocument && (ds.selectedDocument.item.type === XmomObjectType.ServiceGroup || ds.selectedDocument.item.type === XmomObjectType.DataType)),
            isBusy: ds => ds.isSelectedDocumentDownloading
        },
        {
            name: ToolbarComponent.BUTTON_NAME_PRINT,
            tooltip: 'print',
            iconName: 'tb-print',
            isDisabled: ds => !ds.selectedDocument
        }
    ];


    private static readonly WorkflowButtonDescriptions: ToolbarItem[] = [
        {
            name: ToolbarComponent.BUTTON_NAME_SERVICE,
            tooltip: 'service',
            iconName: 'tb-workflow',
            xmomItem: XoInvocation.abstractInvocation()
        },
        {
            name: ToolbarComponent.BUTTON_NAME_PARAMETER,
            tooltip: 'parameter',
            iconName: 'tb-datatype',
            xmomItem: XoData.abstractData()
        },
        {
            name: ToolbarComponent.BUTTON_NAME_MAPPING,
            tooltip: 'mapping',
            iconName: 'tb-mapping',
            xmomItem: XoMapping.mapping()
        },
        {
            name: ToolbarComponent.BUTTON_NAME_TYPE_CHOICE,
            tooltip: 'type-choice',
            iconName: 'tb-choice',
            xmomItem: XoTypeChoice.empty()
        },
        {
            name: ToolbarComponent.BUTTON_NAME_CONDITIONAL_CHOICE,
            tooltip: 'conditional-choice',
            iconName: 'tb-choice',
            xmomItem: XoConditionalChoice.empty()
        },
        {
            name: ToolbarComponent.BUTTON_NAME_CONDITIONAL_BRANCHING,
            tooltip: 'conditional-branching',
            iconName: 'tb-choiceconditional',
            xmomItem: XoConditionalBranching.empty()
        },
        // {
        //     name: ToolbarComponent.BUTTON_NAME_OPERATOR,
        //     tooltip: 'Operator',
        //     iconName: 'tb-manualinteraction'
        // },
        {
            buttons: [
                {
                    name: ToolbarComponent.BUTTON_NAME_WAIT,
                    tooltip: 'wait',
                    iconName: 'tb-wait',
                    xmomItem: XoWorkflowInvocation.wait()
                },
                {
                    name: ToolbarComponent.BUTTON_NAME_AWAIT,
                    tooltip: 'await',
                    iconName: 'tb-await',
                    xmomItem: XoWorkflowInvocation.await()
                },
                {
                    name: ToolbarComponent.BUTTON_NAME_NOTIFY,
                    tooltip: 'notify',
                    iconName: 'tb-notify',
                    xmomItem: XoWorkflowInvocation.notify()
                },
                {
                    name: ToolbarComponent.BUTTON_NAME_MI,
                    tooltip: 'manual-interaction',
                    iconName: 'tb-manualinteraction',
                    xmomItem: XoWorkflowInvocation.manualInteraction()
                }
            ]
        },
        {
            name: ToolbarComponent.BUTTON_NAME_THROW,
            tooltip: 'throw',
            iconName: 'tb-exception'
            /*xmomItem: XoThrow.throw()*/
        },
        {
            name: ToolbarComponent.BUTTON_NAME_RETRY,
            tooltip: 'retry',
            iconName: 'tb-rollup',
            xmomItem: XoRetry.retry()
        },
        {
            buttons: [
                {
                    name: ToolbarComponent.BUTTON_NAME_TEMPLATE,
                    tooltip: 'template',
                    iconName: 'tb-template',
                    xmomItem: XoTemplate.template()
                },
                {
                    name: ToolbarComponent.BUTTON_NAME_BEGIN_DOCUMENT,
                    tooltip: 'begin-document',
                    iconName: 'tb-templatestart',
                    xmomItem: XoWorkflowInvocation.beginDocument()
                },
                {
                    name: ToolbarComponent.BUTTON_NAME_RETRIEVE_DOCUMENT,
                    tooltip: 'retrieve-document',
                    iconName: 'tb-documentretrieve',
                    xmomItem: XoWorkflowInvocation.retrieveDocument()
                },
                {
                    name: ToolbarComponent.BUTTON_NAME_END_DOCUMENT,
                    tooltip: 'end-document',
                    iconName: 'tb-templateend',
                    xmomItem: XoWorkflowInvocation.endDocument()
                }
            ]
        },
        {
            buttons: [
                {
                    name: ToolbarComponent.BUTTON_NAME_QUERY,
                    tooltip: 'query-storable',
                    iconName: 'tb-database',
                    xmomItem: XoQuery.query()
                },
                {
                    name: ToolbarComponent.BUTTON_NAME_STORE,
                    tooltip: 'store-storable',
                    iconName: 'tb-storablestore',
                    xmomItem: XoWorkflowInvocation.store()
                },
                {
                    name: ToolbarComponent.BUTTON_NAME_DELETE,
                    tooltip: 'delete-storable',
                    iconName: 'tb-storabledelete',
                    xmomItem: XoWorkflowInvocation.delete()
                }
            ]
        }
        // {
        //     name: ToolbarComponent.BUTTON_NAME_WORKFLOW_NOTE,
        //     tooltip: 'Note',
        //     iconName: 'tb-pen'
        // }
    ];


    private static readonly TypeButtonDescriptions: ToolbarButtonDescription[] = [
        // {
        //     name: ToolbarComponent.BUTTON_NAME_MEMBER_VARIABLE,
        //     tooltip: 'member-variable',
        //     iconName: 'tb-datatype'
        // },
        // {
        //     name: ToolbarComponent.BUTTON_NAME_INSTANCE_SERVICE,
        //     tooltip: 'instance-service',
        //     iconName: 'tb-workflow'
        // }
        // {
        //     name: ToolbarComponent.BUTTON_NAME_TYPE_NOTE,
        //     tooltip: 'Note',
        //     iconName: 'tb-pen'
        // }
    ];


    private cdrSubscription: Subscription;
    private lockedSubscription: Subscription;


    constructor(
        readonly documentService: DocumentService,
        private readonly dialogService: XcDialogService,
        private readonly selectionService: SelectionService,
        private readonly cdr: ChangeDetectorRef,
        protected readonly i18n: I18nService
    ) {
    }


    ngAfterViewInit() {
        this.cdrSubscription = merge(
            of(),
            this.selectionService.selectionChange,
            this.documentService.selectionChange.pipe(tap(document => {
                this.lockedSubscription?.unsubscribe();
                this.lockedSubscription = document?.lockedChange.subscribe(() => this.cdr.detectChanges());
            })),
            this.documentService.documentDownloaded,
            this.documentService.xmomService.runtimeContextChange,
            this.documentService.xmomService.itemSaved,
            this.documentService.xmomService.itemDeployed
        ).subscribe(
            () => this.cdr.detectChanges()
        );
    }


    ngOnDestroy() {
        this.cdrSubscription?.unsubscribe();
    }


    get genericButtonDescriptions(): ToolbarButtonDescription[] {
        if (this.documentService.selectedDocument instanceof WorkflowDocumentModel) {
            return ToolbarComponent.WorkflowDocumentButtonDescriptions;
        }
        if (this.documentService.selectedDocument instanceof TypeDocumentModel) {
            return ToolbarComponent.TypeDocumentButtonDescriptions;
        }
        return ToolbarComponent.CommonDocumentButtonDescriptions;
    }


    get specificToolbarItems(): ToolbarItem[] {
        if (this.documentService.selectedDocument instanceof WorkflowDocumentModel) {
            return ToolbarComponent.WorkflowButtonDescriptions;
        }
        if (this.documentService.selectedDocument instanceof TypeDocumentModel) {
            return ToolbarComponent.TypeButtonDescriptions;
        }
        return [];
    }


    isMenu(item: ToolbarItem): boolean {
        return !!(item as ToolbarButtonDescriptionGroup).buttons;
    }


    /**
     * @description Only use this function to cast a type in html templates!
     * @see https://github.com/angular/angular/issues/17953
     */
    castToDescriptionGroup(item: ToolbarItem): ToolbarButtonDescriptionGroup {
        return item as ToolbarButtonDescriptionGroup;
    }


    /**
     * @description Only use this function to cast a type in html templates!
     * @see https://github.com/angular/angular/issues/17953
     */
    castToDescription(item: ToolbarItem): ToolbarButtonDescription {
        return item as ToolbarButtonDescription;
    }


    selectGenericMenuItem(item: XcMenuItem) {
        switch (item) {
            case ToolbarComponent.WorkflowMenuItem: this.documentService.newWorkflow(); break;
            case ToolbarComponent.DataTypeMenuItem: this.documentService.newDataType(); break;
            case ToolbarComponent.ExceptionTypeMenuItem: this.documentService.newExceptionType(); break;
            case ToolbarComponent.ServiceGroupMenuItem: this.documentService.newServiceGroup(); break;
        }
    }


    clickToolbarButton(description: ToolbarButtonDescription) {
        const document = this.documentService.selectedDocument;
        if (!document) {
            return;
        }

        switch (description.name) {
            case ToolbarComponent.BUTTON_NAME_SAVE:
                this.documentService.saveDocumentGeneric(document).subscribe();
                break;
            case ToolbarComponent.BUTTON_NAME_SAVE_AS:
                this.documentService.saveDocumentAs(document).subscribe();
                break;
            case ToolbarComponent.BUTTON_NAME_DEPLOY:
                if (document instanceof WorkflowDocumentModel) {
                    this.documentService.deployDocumentGeneric(document).subscribe();
                } else {
                    of(undefined).pipe(
                        switchMap(() => this.documentService.saveDocumentGeneric(document)),
                        switchMap(() => this.documentService.deployDocument(document))
                    ).subscribe();
                }
                break;
            case ToolbarComponent.BUTTON_NAME_DEPLOY_AS:
                this.documentService.deployDocumentAs(document).subscribe();
                break;
            case ToolbarComponent.BUTTON_NAME_WAIT:
                this.dialogService.info('Note', 'The respective services can be found inside xprc.waitsuspend, xprc.synchronization, and xmcp.manualinteraction');
                break;
            case ToolbarComponent.BUTTON_NAME_THROW:
                this.dialogService.info('Note', 'Drag an Exception Type into the Workflow to create a Throw step');
                break;
            case ToolbarComponent.BUTTON_NAME_PRINT:
                this.dialogService.info('Note', 'Not yet supported');
                break;
            case ToolbarComponent.BUTTON_NAME_DOWNLOAD_TEMPLATE:
                if (document instanceof TypeDocumentModel) {
                    this.documentService.downloadTemplate(document);
                }
                break;
        }
    }


    isIconButtonForVersion1_0(description: ToolbarButtonDescription): boolean {
        return [
            ToolbarComponent.BUTTON_NAME_THROW
        ].indexOf(description.name) >= 0;
    }
}
