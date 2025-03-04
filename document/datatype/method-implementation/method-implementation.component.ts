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
import { ChangeDetectorRef, Component, ElementRef, Injector, Input, Optional } from '@angular/core';

import { XoLibraryCallRequest } from '@pmod/xo/library-call-request.model';
import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { ModellingAction, ModellingActionType } from '../../../api/xmom.service';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoChangeAbortableRequest } from '../../../xo/change-abortable-request.model';
import { XoChangeMemberMethodImplementationRequest } from '../../../xo/change-member-method-implementation-request.model';
import { XoMethod } from '../../../xo/method.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingItemComponent, TriggeredAction } from '../../workflow/shared/modelling-object.component';
import { combineLatest } from 'rxjs';
import { XoDefinitionBundle } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';
import { PluginService } from '@pmod/document/plugin.service';


@Component({
    selector: 'method-implementation',
    templateUrl: './method-implementation.component.html',
    styleUrls: ['./method-implementation.component.scss'],
    standalone: false
})
export class MethodImplementationComponent extends ModellingItemComponent {

    pluginBundles: XoDefinitionBundle[];

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        private readonly dialogService: XcDialogService,
        private readonly i18nService: I18nService,
        readonly pluginService: PluginService,
        detailLevelService: WorkflowDetailLevelService,
        private readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
    }


    get isAbstractMethod() {
        return this.method
            ? this.method.implementationType === XoMethod.IMPL_TYPE_ABSTRACT
            : false;
    }


    get isAbortable(): boolean {
        return this.method ? this.method.isAbortable : false;
    }


    set isAbortable(value: boolean) {
        if (this.method && !this.readonly) {
            this.method.isAbortable = value;
            const triggeredAction: TriggeredAction = {
                type: ModellingActionType.change,
                objectId: this.method.id,
                request: new XoChangeAbortableRequest(undefined, value)
            };
            this.performAction(triggeredAction);
        }
    }


    @Input()
    set method(value: XoMethod) {
        this.setModel(value);
        this.updateBundles();
    }


    get method(): XoMethod {
        return this.getModel() as XoMethod;
    }


    implementationChange(value: string) {
        if (!this.method.readonlyImplementation && !this.readonly) {

            const text = value;

            if (this.method.implementationArea.text !== text) {
                const triggeredAction: TriggeredAction = {
                    type: ModellingActionType.change,
                    objectId: this.method.id,
                    request: new XoChangeMemberMethodImplementationRequest(undefined, text)
                };
                this.performAction(triggeredAction);
            }
        }
    }

    useTemplateCall() {
        const document = this.documentService.selectedDocument;
        this.dialogService.confirm(this.i18nService.translate('pmod.datatype.method-details.method-implementation.title'), this.i18nService.translate('pmod.datatype.method-details.method-implementation.message'))
            .afterDismissResult().subscribe(result => {
                if (result) {
                    const request = new XoLibraryCallRequest();
                    const action: ModellingAction = {
                        type: ModellingActionType.libraryCall,
                        request,
                        objectId: this.method.id,
                        rtc: document.originRuntimeContext,
                        xmomItem: document.item
                    };
                    this.documentService.performModellingAction(action, document.item).subscribe();
                }
            });
    }

    private updateBundles() {
        this.pluginBundles = [];
        if (this.method.implementationArea.plugin?.guiDefiningWorkflow) {
            combineLatest(
                this.method.implementationArea.plugin.guiDefiningWorkflow.data.map(
                    value => this.pluginService.getFromCacheOrCallWorkflow(value)
                )
            ).subscribe(bundles => {
                bundles.forEach(bundle => bundle.data.push(this.method.implementationArea.plugin.context));
                this.pluginBundles = bundles;
                this.cdr.markForCheck();
            });
        }
    }
}
