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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, Input, Optional, ViewChild } from '@angular/core';

import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcFormAutocompleteComponent, XcOptionItemStringOrUndefined, XcOptionItemTranslate } from '@zeta/xc';

import { filter } from 'rxjs/operators';

import { ModellingActionType } from '../../../api/xmom.service';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoChangeLabelRequest } from '../../../xo/change-label-request.model';
import { XoChangeMemberMethodImplementationTypeRequest } from '../../../xo/change-member-method-implementation-type-request.model';
import { XoChangeMemberMethodReferenceRequest } from '../../../xo/change-member-method-reference-request.model';
import { XoDataType } from '../../../xo/data-type.model';
import { XoDynamicMethod } from '../../../xo/dynamic-method.model';
import { XoMethod } from '../../../xo/method.model';
import { XoMoveModellingObjectRequest } from '../../../xo/move-modelling-object-request.model';
import { XoStaticMethod } from '../../../xo/static-method.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DataTypeService } from '../../datatype.service';
import { DocumentService } from '../../document.service';
import { ModRelativeHoverSide } from '../../workflow/shared/drag-and-drop/mod-drag-and-drop.service';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';
import { XoModellingItem } from '@pmod/xo/modelling-item.model';
import { FullQualifiedName } from '@zeta/api';


@Component({
    selector: 'method-details',
    templateUrl: './method-details.component.html',
    styleUrls: ['./method-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MethodDetailsComponent extends ModellingItemComponent {

    readonly implementationTypeDataWrapper: XcAutocompleteDataWrapper;
    readonly referenceDataWrapper: XcAutocompleteDataWrapper;


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        private readonly datatypeService: DataTypeService,
        private readonly i18n: I18nService,
        private readonly cdr: ChangeDetectorRef,
        detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        this.implementationTypeDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.method.implementationType,
            value => {
                if (this.method.implementationType !== value) {
                    this.method.implementationType = value;
                    this.method.readonlyImplementation = false;

                    if (value === XoMethod.IMPL_TYPE_ABSTRACT) {
                        this.method.implementation = '';
                        this.method.readonlyImplementation = true;
                    }

                    if (value !== XoMethod.IMPL_TYPE_REFERENCE) {
                        this.performAction({
                            type: ModellingActionType.change,
                            objectId: this.method.id,
                            request: new XoChangeMemberMethodImplementationTypeRequest(undefined, value)
                        });
                    }
                }
            }
        );

        this.referenceDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.method instanceof XoDynamicMethod ? this.method.reference : undefined,
            value => {
                if (this.method instanceof XoDynamicMethod && this.method.reference !== value) {
                    this.method.reference = value;
                    if (value) {
                        this.performAction({
                            type: ModellingActionType.change,
                            objectId: this.method.id,
                            request: new XoChangeMemberMethodReferenceRequest(undefined, value)
                        });
                    }
                }
            }
        );

        this.untilDestroyed(this.referenceDataWrapper.valuesChange).subscribe(
            () => this.cdr.detectChanges()
        );
    }


    private refreshImplementationTypeAutocomplete() {
        this.implementationTypeDataWrapper.values = [
            XcOptionItemTranslate(this.i18n, XoMethod.IMPL_TYPE_ABSTRACT),
            XcOptionItemTranslate(this.i18n, XoMethod.IMPL_TYPE_CODED_SERVICE),
            XcOptionItemTranslate(this.i18n, XoMethod.IMPL_TYPE_REFERENCE, !this.isReferenceAsImplementationTypePossible)
        ];
    }


    private refreshReferenceAutocomplete() {
        const item = this.documentService.selectedDocument.item;
        if (this.method && item.$fqn && item.$rtc) {
            this.datatypeService.getReferencesOfMemberFunction(
                item.toFqn(),
                item.toRtc(),
                this.method.id
            ).subscribe(items =>
                this.referenceDataWrapper.values = items.candidates.data.map(ref => ({name: ref.$fqn, value: ref.$fqn}))
            );
        }
    }


    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    @ViewChild('referenceAutocomplete', {static: false, read: XcFormAutocompleteComponent})
    set pathAutocomplete(value: XcFormAutocompleteComponent) {
        this.untilDestroyed(value?.focus)?.pipe(filter(() => !value.disabled)).subscribe(() => this.refreshReferenceAutocomplete());
    }


    get method(): XoMethod {
        return this.getModel() as XoMethod;
    }


    @Input()
    set method(value: XoMethod) {
        this.setModel(value);
        if (value) {
            this.refreshImplementationTypeAutocomplete();
            this.referenceDataWrapper.preset(v => XcOptionItemStringOrUndefined(v));
        }
    }


    get isStaticMethod() {
        return this.method ? this.method instanceof XoStaticMethod : false;
    }


    get isReferenceAsImplementationTypePossible(): boolean {
        // TODO: implement
        return true;
    }


    get isAbstractMethod() {
        return this.method.implementationType === XoMethod.IMPL_TYPE_ABSTRACT;
    }


    get isReferenceAsImplementationTypeSet(): boolean {
        return this.method.implementationType === XoMethod.IMPL_TYPE_REFERENCE;
    }


    get isMethodImplementationTypeSet(): boolean {
        return this.method.implementationType === XoMethod.IMPL_TYPE_CODED_SERVICE || this.method.implementationType === XoMethod.IMPL_TYPE_ABSTRACT;
    }


    labelBlur(event: FocusEvent) {
        if (!this.readonly) {
            const value = (event.target as HTMLInputElement).value;
            if (this.method.label !== value) {
                this.method.label = value;
                this.performAction({
                    type: ModellingActionType.change,
                    objectId: this.method.id,
                    request: new XoChangeLabelRequest(undefined, value)
                });
            }
        }
    }


    overrideInstanceMethod() {
        this.performAction({
            objectId: this.method.id,
            type: ModellingActionType.move,
            request: new XoMoveModellingObjectRequest(
                undefined,
                -1, // add at the bottom
                (this.method.parent.parent as XoDataType).overriddenMethodsArea.id,
                ModRelativeHoverSide.inside
            )
        });
    }

    createWorkflow() {
        const input = this.method.inputArea.items.data as XoModellingItem[];
        const output = this.method.outputArea.items.data as XoModellingItem[];

        this.documentService.newWorkflow('New Workflow', false, input, output);
    }

    openReferencedWorkflow() {
        if (this.method instanceof XoDynamicMethod && this.method.reference) {
            this.documentService.loadWorkflow(this.method.toRtc(), FullQualifiedName.decode(this.method.reference));
        }
    }
}
