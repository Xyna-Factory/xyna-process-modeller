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
import { ChangeDetectorRef, Component, inject, Input } from '@angular/core';

import { MinMaxService } from '@pmod/document/min-max.service';
import { PluginService } from '@pmod/document/plugin.service';
import { XoLibraryCallRequest } from '@pmod/xo/library-call-request.model';
import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';
import { XoDefinitionBundle } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';

import { combineLatest } from 'rxjs';

import { ModellingAction, ModellingActionType } from '../../../api/xmom.service';
import { XoChangeAbortableRequest } from '../../../xo/change-abortable-request.model';
import { XoChangeMemberMethodImplementationRequest } from '../../../xo/change-member-method-implementation-request.model';
import { XoMethod } from '../../../xo/method.model';
import { DocumentService } from '../../document.service';
import { ModellingItemComponent, TriggeredAction } from '../../workflow/shared/modelling-object.component';
import { VariableAreaDocumentComponent } from '../../workflow/variable-area/variable-area-document.component';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../zeta/i18n/i18n.module';
import { CodingComponent } from '../coding/coding.component';


@Component({
    selector: 'method-implementation',
    templateUrl: './method-implementation.component.html',
    styleUrls: ['./method-implementation.component.scss'],
    imports: [VariableAreaDocumentComponent, XcModule, I18nModule, CodingComponent]
})
export class MethodImplementationComponent extends ModellingItemComponent {

    protected readonly documentService = inject(DocumentService);
    protected readonly dialogService = inject(XcDialogService);
    protected readonly minmaxService = inject(MinMaxService);
    protected readonly i18nService = inject(I18nService);
    protected readonly pluginService = inject(PluginService);
    protected readonly cdr = inject(ChangeDetectorRef);

    pluginBundles: XoDefinitionBundle[];

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

    resize() {
        this.minmaxService.toggle();
    }

    getTooltip(): string {
        return this.minmaxService.tooltip();
    }

    getIcon(): string {
        return this.minmaxService.icon();
    }
}
