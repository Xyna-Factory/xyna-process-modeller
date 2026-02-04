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
import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';

import { DataTypeService } from '@pmod/document/datatype.service';
import { XoChangeLabelRequest } from '@pmod/xo/change-label-request.model';
import { XoChangeMemberVariableFqnRequest } from '@pmod/xo/change-member-variable-fqn-request.model';
import { XoChangeMemberVariablePrimitiveTypeRequest } from '@pmod/xo/change-member-variable-primitive-type-request.model';
import { XoChangeTextRequest } from '@pmod/xo/change-text-request.model';
import { FullQualifiedName } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcFormAutocompleteComponent, XcOptionItemString, XcOptionItemStringOrUndefined, XcOptionItemTranslate } from '@zeta/xc';

import { filter } from 'rxjs';

import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../../../zeta/xc/xc.module';
import { TypeDocumentationAreaComponent } from '../../type-documentation-area/type-documentation-area.component';
import { DatatypeVariableTabComponent } from '../datatype-tab.component';


@Component({
    templateUrl: './member-variable-base-tab.component.html',
    styleUrls: ['./member-variable-base-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcModule, I18nModule, TypeDocumentationAreaComponent]
})
export class MemberVariableBaseTabComponent extends DatatypeVariableTabComponent {
    private readonly dataTypeService = inject(DataTypeService);
    private readonly i18n = inject(I18nService);


    private static readonly PRIMITIVE_TYPES = [
        FullQualifiedName.String.name,
        FullQualifiedName.int.name,
        FullQualifiedName.Integer.name,
        FullQualifiedName.long.name,
        FullQualifiedName.Long.name,
        FullQualifiedName.double.name,
        FullQualifiedName.Double.name,
        FullQualifiedName.boolean.name,
        FullQualifiedName.Boolean.name
    ];

    readonly dataTypeDataWrapper: XcAutocompleteDataWrapper<string>;

    constructor() {
        super();

        this.dataTypeDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.memberVariable.primitiveType || this.memberVariable.$fqn,
            value => {
                const primitive = MemberVariableBaseTabComponent.PRIMITIVE_TYPES.includes(value);
                if (primitive && value !== this.memberVariable.primitiveType) {
                    this.memberVariable.$fqn = undefined;
                    this.memberVariable.primitiveType = value;
                    this.performMemberVariableChange(new XoChangeMemberVariablePrimitiveTypeRequest(undefined, value));
                }
                if (!primitive && value !== this.memberVariable.$fqn) {
                    this.memberVariable.$fqn = value;
                    this.memberVariable.primitiveType = undefined;
                    if (value) {
                        this.performMemberVariableChange(new XoChangeMemberVariableFqnRequest(undefined, value));
                    }
                }
            }
        );

        this.untilDestroyed(this.dataTypeDataWrapper.valuesChange).subscribe(
            () => this.cdr.detectChanges()
        );

        this.untilDestroyed(this.injectedData.update).subscribe(() => {
            this.dataTypeDataWrapper.preset(v => XcOptionItemStringOrUndefined(v));
        });
    }

    private refreshDataTypeAutocomplete() {
        const rtc = this.documentService.selectedDocument.item.$rtc;
        this.dataTypeService.getDataTypes(rtc.runtimeContext(), [DataTypeService.ANYTYPE]).subscribe(types => {
            this.dataTypeDataWrapper.values = [
                ...MemberVariableBaseTabComponent.PRIMITIVE_TYPES.map(primitive => XcOptionItemTranslate(this.i18n, primitive)),
                ...types.map(type => XcOptionItemString(type.typeFqn.uniqueKey))
            ];
        });
    }


    @ViewChild('dataTypeAutocomplete', {static: false, read: XcFormAutocompleteComponent})
    set dataTypeAutocomplete(value: XcFormAutocompleteComponent) {
        this.untilDestroyed(value?.focus)?.pipe(filter(() => !value.disabled)).subscribe(() => this.refreshDataTypeAutocomplete());
    }


    labelBlur(event: FocusEvent) {
        if (!this.readonly) {
            const value = (event.target as HTMLInputElement).value;
            if (this.memberVariable.label !== value) {
                this.memberVariable.label = value;
                this.performMemberVariableChange(new XoChangeLabelRequest(undefined, value), this.memberVariable.id);
            }
        }
    }


    documentationBlur(event: FocusEvent) {
        if (!this.readonly) {
            const value = (event.target as HTMLTextAreaElement).value;
            if (this.memberVariable.documentation !== value) {
                this.memberVariable.documentation = value;
                this.performMemberVariableChange(new XoChangeTextRequest(undefined, value), this.memberVariable.documentationArea.id);
            }
        }
    }
}
