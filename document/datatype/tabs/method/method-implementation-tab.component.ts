/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Optional, ViewChild } from '@angular/core';
import { DataTypeService } from '@pmod/document/datatype.service';
import { DocumentService } from '@pmod/document/document.service';
import { I18nService } from '@zeta/i18n';
import { DatatypeMethodTabComponent } from '../datatype-tab.component';
import { XoMethod } from '@pmod/xo/method.model';
import { XcAutocompleteDataWrapper, XcFormAutocompleteComponent, XcOptionItem, XcOptionItemStringOrUndefined, XcOptionItemTranslate } from '@zeta/xc';
import { XoChangeMemberMethodImplementationTypeRequest } from '@pmod/xo/change-member-method-implementation-type-request.model';
import { XoDynamicMethod } from '@pmod/xo/dynamic-method.model';
import { XoChangeMemberMethodReferenceRequest } from '@pmod/xo/change-member-method-reference-request.model';
import { filter } from 'rxjs';

@Component({
    templateUrl: './method-implementation-tab.component.html',
    styleUrls: ['./method-implementation-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class MethodImplementationTabComponent extends DatatypeMethodTabComponent {

    readonly implementationTypeDataWrapper: XcAutocompleteDataWrapper;
    readonly referenceDataWrapper: XcAutocompleteDataWrapper;

    constructor(
        documentService: DocumentService,
        private readonly dataTypeService: DataTypeService,
        private readonly i18n: I18nService,
        cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(documentService, cdr, injector);

        this.implementationTypeDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.method.implementationType,
            value => {
                if (this.method.implementationType !== value) {
                    this.method.implementationType = value;
                    this.method.readonlyImplementation = false;

                    if (value === XoMethod.IMPL_TYPE_ABSTRACT) {
                        this.method.implementationArea.text = '';
                        this.method.readonlyImplementation = true;
                    }

                    if (value !== XoMethod.IMPL_TYPE_REFERENCE) {
                        this.performMethodChange(new XoChangeMemberMethodImplementationTypeRequest(undefined, value));
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
                        this.performMethodChange(new XoChangeMemberMethodReferenceRequest(undefined, value));
                    }
                }
            }
        );

        this.untilDestroyed(this.referenceDataWrapper.valuesChange).subscribe(
            () => this.cdr.detectChanges()
        );

        this.untilDestroyed(this.injectedData.update).subscribe(() => {
            this.refreshImplementationTypeAutocomplete();
            this.referenceDataWrapper.preset(v => XcOptionItemStringOrUndefined(v));
            this.cdr.markForCheck();
        });
    }

    private refreshImplementationTypeAutocomplete() {
        const values: XcOptionItem<string>[] = [
            XcOptionItemTranslate(this.i18n, XoMethod.IMPL_TYPE_CODED_SERVICE),
            XcOptionItemTranslate(this.i18n, XoMethod.IMPL_TYPE_CODED_SERVICE_PYTHON)
        ];
        if (!this.isStaticMethod) {
            values.unshift(XcOptionItemTranslate(this.i18n, XoMethod.IMPL_TYPE_ABSTRACT, this.isStaticMethod));
            values.push(XcOptionItemTranslate(this.i18n, XoMethod.IMPL_TYPE_REFERENCE, this.isStaticMethod || !this.isReferenceAsImplementationTypePossible));
        }
        this.implementationTypeDataWrapper.values = values;
    }


    private refreshReferenceAutocomplete() {
        const item = this.documentService.selectedDocument.item;
        if (this.method && item.$fqn && item.$rtc) {
            this.dataTypeService.getReferencesOfMemberFunction(
                item.toFqn(),
                item.toRtc(),
                this.method.id
            ).subscribe(items =>
                this.referenceDataWrapper.values = items.candidates.data.map(ref => ({name: ref.$fqn, value: ref.$fqn}))
            );
        }
    }


    @ViewChild('referenceAutocomplete', {static: false, read: XcFormAutocompleteComponent})
    set pathAutocomplete(value: XcFormAutocompleteComponent) {
        this.untilDestroyed(value?.focus)?.pipe(filter(() => !value.disabled)).subscribe(() => this.refreshReferenceAutocomplete());
    }
}
