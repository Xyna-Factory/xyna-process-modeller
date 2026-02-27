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
import { Component, ElementRef, inject, Injector, OnDestroy } from '@angular/core';

import { WorkflowTesterData, WorkflowTesterDialogComponent } from '@fman/workflow-tester/workflow-tester-dialog.component';
import { FullQualifiedName } from '@zeta/api';
import { copyToClipboard, KeyboardEventType, KeyDistributionService, pasteFromClipboard } from '@zeta/base';
import { XcContentEditableDirective, XcMenuItem, XcStatusBarEntryType, XcStatusBarService } from '@zeta/xc';

import { Subscription, throwError } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';

import { I18nModule } from '../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../zeta/xc/xc.module';
import { DeploymentState } from '../api/xmom-types';
import { ModellingActionType, XmomState } from '../api/xmom.service';
import { XoConnectionArray } from '../xo/connection.model';
import { XoError } from '../xo/error.model';
import { XoInsertModellingObjectRequest } from '../xo/insert-modelling-object-request.model';
import { XoInsertXmlRequestContent } from '../xo/insert-xml-request-content.model';
import { XoInvocation } from '../xo/invocation.model';
import { XoSetDataflowConnectionRequest } from '../xo/set-dataflow-connection-request.model';
import { XoWorkflow } from '../xo/workflow.model';
import { DocumentComponent } from './document.component';
import { DocumentItem } from './model/document.model';
import { WorkflowDocumentModel } from './model/workflow-document.model';
import { SelectionService } from './selection.service';
import { WorkflowDetailLevelService } from './workflow-detail-level.service';
import { DataflowComponent } from './workflow/dataflow/dataflow.component';
import { BranchSelectionService } from './workflow/distinction/branch/branch-selection.service';
import { DocumentationAreaComponent } from './workflow/documentation-area/documentation-area.component';
import { DropIndicatorComponent } from './workflow/drop-indicator/drop-indicator.component';
import { ExceptionHandlingAreaComponent } from './workflow/exception/exception-handling-area/exception-handling-area.component';
import { TypeLabelAreaComponent } from './workflow/type-label-area/type-label-area.component';
import { VariableAreaDocumentComponent } from './workflow/variable-area/variable-area-document.component';
import { WorkflowComponent } from './workflow/workflow/workflow.component';


@Component({
    templateUrl: './workflow-document.component.html',
    styleUrls: ['./workflow-document.component.scss'],
    // single service instances per document
    providers: [SelectionService, BranchSelectionService, WorkflowDetailLevelService],
    imports: [I18nModule, DataflowComponent, VariableAreaDocumentComponent, TypeLabelAreaComponent, DocumentationAreaComponent, WorkflowComponent, ExceptionHandlingAreaComponent, XcModule, DropIndicatorComponent]
})
export class WorkflowDocumentComponent extends DocumentComponent<void, WorkflowDocumentModel> implements OnDestroy {
    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private readonly keyService = inject(KeyDistributionService);
    private readonly statusBarService = inject(XcStatusBarService);
    private readonly detailLevelService = inject(WorkflowDetailLevelService);

    private readonly menuItemTestWorkflow: XcMenuItem = {
        name: 'pmod.workflow.test-workflow...',
        translate: true,
        visible: () => this.workflow.deploymentState === DeploymentState.deployed || this.workflow.deploymentState === DeploymentState.changed,
        click: () => {
            const fqn = this.workflow.toFqn();
            const rtc = (this.workflow.$rtc ?? this.workflow.evaluatedRtc).runtimeContext();
            this.dialogService.custom(
                WorkflowTesterDialogComponent,
                <WorkflowTesterData>{
                    runtimeContext: rtc,
                    orderType: fqn.encode(),
                    input: this.workflow.runtimeInfo?.getInput()
                }
            ).afterDismiss().subscribe();
        }
    };

    private readonly menuItemToggleDocumentation: XcMenuItem = {
        name: 'pmod.workflow.show-hide-documentation',
        translate: true,
        visible: () => this.workflow.documentationArea && !this.documentService.selectedDocument.isLocked,
        click: () => this.detailLevelService.toggleCollapsed(this.workflow.documentationArea.id)
    };

    private readonly menuItemTogglePaths: XcMenuItem = {
        name: 'pmod.workflow.show-hide-paths-inside-workflow',
        translate: true,
        click: () => this.detailLevelService.setShowFQN(!this.detailLevelService.showFQN)
    };

    private readonly menuItemToggleMappings: XcMenuItem = {
        name: 'pmod.workflow.collapse-all',
        translate: true,
        click: () => this.detailLevelService.setAllCollapsed()
    };

    private readonly menuItemUndo: XcMenuItem = {
        name: 'pmod.workflow.undo',
        aside: this.i18n.translate('pmod.workflow.undo-aside'),
        translate: true,
        visible: () => !this.workflow.readonly && !this.documentService.selectedDocument.isLocked,
        click: () => this.documentService.undo().subscribe()
    };

    private readonly menuItemRedo: XcMenuItem = {
        name: 'pmod.workflow.redo',
        aside: this.i18n.translate('pmod.workflow.redo-aside'),
        translate: true,
        visible: () => !this.workflow.readonly && !this.documentService.selectedDocument.isLocked,
        click: () => this.documentService.redo().subscribe()
    };

    private readonly menuItemCompare: XcMenuItem = {
        name: 'pmod.workflow.compare',
        translate: true,
        visible: () => this.workflow.deploymentState === DeploymentState.deployed || this.workflow.deploymentState === DeploymentState.changed,
        click: () => this.documentService.loadXmomObject(
            this.workflow.$rtc.runtimeContext(),
            FullQualifiedName.decode(this.workflow.$fqn),
            this.workflow.type, false, XmomState.DEPLOYED).subscribe(response => {
                const item = <DocumentItem>response.xmomItem;
                console.log('deployed state: ' + item.encode());
            })
    };

    readonly menuItems = [
        this.menuItemTestWorkflow,
        this.menuItemUndo,
        this.menuItemRedo,
        this.menuItemToggleDocumentation,
        this.menuItemTogglePaths,
        this.menuItemToggleMappings,
        this.menuItemCompare
    ];

    dataflow: XoConnectionArray;
    subscription: Subscription;


    constructor() {
        super();

        this.untilDestroyed(
            this.selectionService.doubleClickObject.pipe(
                map(object => object.modellingItem)
            )
        ).subscribe(
            modellingItem => {
                if (modellingItem instanceof XoInvocation) {
                    if (modellingItem.type) {
                        const fqn = modellingItem.toFqn();
                        const rtc = (modellingItem.$rtc ?? modellingItem.evaluatedRtc).runtimeContext();
                        this.documentService.loadDocument(rtc, fqn, modellingItem.type);
                    }
                }
            }
        );

        // keep on sending next pending modelling actions
        this.untilDestroyed(this.documentService.pendingModellingActionChange).pipe(
            filter(pending => !pending)
        ).subscribe(() =>
            this.sendNextAction()
        );

        // refresh data flow each time, the workflow changes (its revision)
        this.untilDestroyed(this.workflow.revisionChange).subscribe(() => {
            this.untilDestroyed(
                this.documentService.xmomService.getDataflow(this.workflow)
            ).subscribe(dataflowResponse => this.dataflow = dataflowResponse.connections);
        });

        // copy
        this.untilDestroyed(this.keyService.keyEvents).pipe(filter(() => this.document.tabActive)).subscribe(eventObject => {
            if (eventObject.key.toLowerCase() === 'c' && eventObject.ctrl && !this.dialogService.isDialogOpen()) {
                const object = this.selectionService.selectedObject;
                const activeElement = window.document.activeElement;
                const textSelection = window.getSelection().toString();
                if (object && !textSelection && (activeElement === object.getElementRef().nativeElement || activeElement === window.document.body)) {
                    if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                        eventObject.preventDefault();
                    } else {
                        eventObject.execute(() => {
                            this.documentService.xmomService.getXmomObjectXML(
                                this.document.item,
                                object.getModel().id
                            ).pipe(
                                catchError(err => {
                                    this.documentService.showErrorDialog(err.error as XoError);
                                    return throwError(err);
                                })
                            ).subscribe(response => {
                                copyToClipboard(response.xml);
                                this.statusBarService.display(this.i18n.translate('pmod.workflow.copied-to-clipboard'), XcStatusBarEntryType.INFO);
                            });
                        });
                    }
                }
            }
        });

        // paste
        this.untilDestroyed(this.keyService.keyEvents).pipe(filter(() => this.document.tabActive)).subscribe(eventObject => {
            if (eventObject.key.toLowerCase() === 'v' && eventObject.ctrl && !this.dialogService.isDialogOpen()) {
                const activeElement = window.document.activeElement;
                if (activeElement.getAttribute('contenteditable') !== XcContentEditableDirective.getContentEditableValue() && (this.elementRef.nativeElement.contains(activeElement) || activeElement === window.document.body)) {
                    if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                        eventObject.preventDefault();
                    } else {
                        eventObject.execute(() => pasteFromClipboard().subscribe(text => {
                            if (text.includes('xmlns="http://www.gip.com/xyna/xdev/xfractmod"')) {
                                const content = new XoInsertXmlRequestContent(undefined, text);
                                const object = this.selectionService.selectedObject;
                                const model = object?.getModel() ?? this.workflow;
                                this.performModellingAction({
                                    type: ModellingActionType.insert,
                                    objectId: model.id,
                                    request: new XoInsertModellingObjectRequest(undefined, undefined, content)
                                });
                            }
                        }));
                    }
                }
            }
        });
    }


    get workflow(): XoWorkflow {
        return this.document.item;
    }


    get showMenu(): boolean {
        return this.menuItems.some(menuItem => menuItem.visible?.(menuItem));
    }


    changeDataflow(request: XoSetDataflowConnectionRequest) {
        this.untilDestroyed(
            this.documentService.xmomService.setDataflowConnection(this.workflow, request)
        ).subscribe(() => {
            this.documentService.ignoreProgrammaticScroll = true;
            this.documentService.refreshXmomItem(this.workflow);
        });
    }
}
