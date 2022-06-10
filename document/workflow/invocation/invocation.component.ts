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
import { Component, ElementRef, EventEmitter, Injector, Input, Optional, Output } from '@angular/core';
import { Router } from '@angular/router';

import { WorkflowTesterData, WorkflowTesterDialogComponent } from '@fman/workflow-tester/workflow-tester-dialog.component';
import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { FullQualifiedName } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcMenuItem } from '@zeta/xc';

import { ModellingActionType } from '../../../api/xmom.service';
import { LabelPathDialogComponent, LabelPathDialogData } from '../../../misc/modal/label-path-dialog/label-path-dialog.component';
import { XoChangeCompensationRequest } from '../../../xo/change-compensation-request.model';
import { XoChangeDetachedRequest } from '../../../xo/change-detached-request.model';
import { XoChangeFreeCapacitiesRequest } from '../../../xo/change-free-capacities-request.model';
import { XoConvertServiceRequest } from '../../../xo/convert-service-request.model';
import { XoExceptionHandlingArea } from '../../../xo/exception-handling-area.model';
import { XoInvocation } from '../../../xo/invocation.model';
import { XoOrderInputSourceArea } from '../../../xo/order-input-source-area.model';
import { XoRemoteDestinationArea } from '../../../xo/remote-destination-area.model';
import { XoTextArea } from '../../../xo/text-area.model';
import { XoWorkflowInvocation } from '../../../xo/workflow-invocation.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingItemComponent, TriggeredAction } from '../shared/modelling-object.component';


@Component({
    selector: 'invocation',
    templateUrl: './invocation.component.html',
    styleUrls: ['./invocation.component.scss']
})
export class InvocationComponent extends ModellingItemComponent {


    @Output()
    readonly doubleClickProxy = new EventEmitter<void>();


    constructor(
        router: Router,
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        readonly detailLevelService: WorkflowDetailLevelService,
        private readonly i18n: I18nService,
        private readonly dialogService: XcDialogService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        this.menuItems.unshift(
            <XcMenuItem>{ name: 'Open in new Tab', translate: true,
                visible: () => !!this.invocation.$fqn, // prototype step does not have an fqn
                click: () => {
                    if (this.invocation.type) {
                        const fqn = this.invocation.toFqn();
                        const rtc = (this.invocation.$rtc ?? this.invocation.evaluatedRtc).runtimeContext();
                        this.documentService.loadDocument(rtc, fqn, this.invocation.type);
                        void router.navigate(['xfm/Process-Modeller/']);
                    }
                }
            },
            <XcMenuItem>{ name: 'Test Workflow...', translate: true,
                visible: () => this.invocation instanceof XoWorkflowInvocation && !this.invocation.isAbstract,
                click: () => {
                    const fqn = this.invocation.toFqn();
                    const rtc = (this.invocation.$rtc ?? this.invocation.evaluatedRtc).runtimeContext();
                    this.dialogService.custom(
                        WorkflowTesterDialogComponent,
                        <WorkflowTesterData>{
                            runtimeContext: rtc,
                            orderType: fqn.encode(),
                            input: this.invocation.runtimeInfo?.getInput()
                        }
                    ).afterDismiss().subscribe();
                }
            },
            <XcMenuItem>{ name: 'Show/Hide Order Input Source Area', translate: true,
                visible: () => !!this.orderInputSourceArea && this.invocation.allowsOrderInputSource,
                click: () => detailLevelService.toggleCollapsed(this.orderInputSourceArea.id)
            },
            <XcMenuItem>{ name: 'Show/Hide Remote Destination Area', translate: true,
                visible: () => !!this.remoteDestinationArea,
                click: () => detailLevelService.toggleCollapsed(this.remoteDestinationArea.id)
            },
            <XcMenuItem>{ name: 'Show/Hide Documentation Area', translate: true,
                visible: () => !!this.documentationArea,
                click: () => detailLevelService.toggleCollapsed(this.documentationArea.id)
            },
            <XcMenuItem>{ name: 'Convert', translate: true,
                visible: () => this.invocation && this.invocation.isAbstract && !this.readonly,
                children: [
                    // { name: 'to Service', translate: true, click: item => {
                    //     // TODO: implement! PMOD-808
                    //     console.log('Convert to Service: ' + item.name);
                    // }},
                    { name: 'into Workflow...', translate: true, click: item => {
                        const data: LabelPathDialogData = {
                            header: this.i18n.translate(LabelPathDialogComponent.HEADER_CONVERT_TO_WORKFLOW),
                            confirm: this.i18n.translate(LabelPathDialogComponent.CONFIRM_CREATE),
                            presetLabel: this.invocation?.typeLabelArea?.text ?? '',
                            presetPath: FullQualifiedName.decode(this.documentModel.item.$fqn).path,
                            pathsObservable: this.documentService.getPaths()
                        };
                        this.dialogService.custom(LabelPathDialogComponent, data).afterDismissResult().subscribe(result => {
                            if (result) {
                                this.performAction({
                                    type: ModellingActionType.convert,
                                    objectId: this.invocation.id,
                                    request: XoConvertServiceRequest.convertToWorkflow(result)
                                });
                            }
                        });
                    }},
                    { name: 'into Mapping', translate: true, click: item => {
                        this.performAction({
                            type: ModellingActionType.convert,
                            objectId: this.invocation.id,
                            request: XoConvertServiceRequest.convertToMapping()
                        });
                    }}
                ]
            },
            <XcMenuItem>{ name: 'Add/Remove Detached Operator', translate: true,
                visible: () => this.invocation.detachedTaggable && !this.readonly && !this.exceptionHandlingArea.hasCompensations(),
                click: () => {
                    this.performAction({
                        type: ModellingActionType.change,
                        objectId: this.invocation.id,
                        request: new XoChangeDetachedRequest(undefined, !this.invocation.detached)
                    });
                }
            },
            <XcMenuItem>{ name: 'Add/Remove Free Capacities Operator', translate: true,
                visible: () => this.invocation.freeCapacitiesTaggable && !this.readonly,
                click: () => {
                    this.performAction({
                        type: ModellingActionType.change,
                        objectId: this.invocation.id,
                        request: new XoChangeFreeCapacitiesRequest(undefined, !this.invocation.freeCapacities)
                    });
                }
            }
        );
    }


    performAction(action: TriggeredAction) {
        // fill objectId for the compensation-override (must be ID of this invocation)
        if (action.request instanceof XoChangeCompensationRequest && !action.objectId) {
            action.objectId = this.invocation.id;
        }
        super.performAction(action);
    }


    @Input()
    set invocation(value: XoInvocation) {
        this.setModel(value);
    }


    get invocation(): XoInvocation {
        return this.getModel() as XoInvocation;
    }


    get documentationArea(): XoTextArea {
        return this.invocation.documentationArea;
    }


    get exceptionHandlingArea(): XoExceptionHandlingArea {
        return this.invocation.exceptionHandlingArea;
    }


    get orderInputSourceArea(): XoOrderInputSourceArea {
        return this.invocation.orderInputSourceArea;
    }


    get remoteDestinationArea(): XoRemoteDestinationArea {
        return this.invocation.remoteDestinationArea;
    }


    get suffixSymbol(): string {
        if (this.invocation.freeCapacities) {
            return 'C';
        }
        if (this.invocation.detached) {
            return 'd';
        }
        return '';
    }


    get suffixTooltip(): string {
        if (this.invocation.freeCapacities) {
            return 'free Capacities';
        }
        if (this.invocation.detached) {
            return 'detached Execution';
        }
        return '';
    }
}
