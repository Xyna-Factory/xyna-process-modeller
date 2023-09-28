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

import { FullQualifiedName } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcFormAutocompleteComponent, XcOptionItemString, XcOptionItemStringOrUndefined, XcOptionItemTranslate } from '@zeta/xc';

import { filter } from 'rxjs/operators';

import { ModellingActionType } from '../../../api/xmom.service';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoChangeLabelRequest } from '../../../xo/change-label-request.model';
import { XoChangeMemberVariableFqnRequest } from '../../../xo/change-member-variable-fqn-request.model';
import { XoChangeMemberVariableIsListRequest } from '../../../xo/change-member-variable-is-list-request.model';
import { XoChangeMemberVariablePrimitiveTypeRequest } from '../../../xo/change-member-variable-primitive-type-request.model';
import { XoChangeMemberVariableStorableRoleRequest } from '../../../xo/change-member-variable-storable-role-request.model';
import { XoChangeTextRequest } from '../../../xo/change-text-request.model';
import { XoMemberVariable } from '../../../xo/member-variable.model';
import { XoRequest } from '../../../xo/request.model';
import { XoRuntimeContext } from '../../../xo/runtime-context.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DataTypeService } from '../../datatype.service';
import { DocumentService } from '../../document.service';
import { ModellingItemComponent } from '../../workflow/shared/modelling-object.component';


@Component({
    selector: 'member-variable-details',
    templateUrl: './member-variable-details.component.html',
    styleUrls: ['./member-variable-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberVariableDetailsComponent extends ModellingItemComponent {

    private static readonly ROLE_UID = 'uniqueIdentifier';
    private static readonly ROLE_HISTO_TS = 'historizationTimeStamp';
    private static readonly ROLE_CUR_VER_FLAG = 'currentVersionFlag';

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

    readonly storableRoleDataWrapper: XcAutocompleteDataWrapper<string>;
    readonly dataTypeDataWrapper: XcAutocompleteDataWrapper<string>;

    @Input()
    dataTypeRTC: XoRuntimeContext;

    @Input()
    isStorable = false;


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        private readonly dataTypeService: DataTypeService,
        private readonly i18n: I18nService,
        private readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        this.storableRoleDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.memberVariable.storableRole ?? '',
            value => {
                if (this.memberVariable.storableRole !== value) {
                    this.memberVariable.storableRole = value;
                    this.performMemberVariableChange(new XoChangeMemberVariableStorableRoleRequest(undefined, value));
                }
            }
        );

        this.dataTypeDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.memberVariable.primitiveType || this.memberVariable.$fqn,
            value => {
                const primitive = MemberVariableDetailsComponent.PRIMITIVE_TYPES.includes(value);
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
    }


    private refreshStorableRoleAutocomplete() {
        this.storableRoleDataWrapper.values = [
            XcOptionItemString(),
            XcOptionItemTranslate(this.i18n, MemberVariableDetailsComponent.ROLE_UID),
            XcOptionItemTranslate(this.i18n, MemberVariableDetailsComponent.ROLE_HISTO_TS),
            XcOptionItemTranslate(this.i18n, MemberVariableDetailsComponent.ROLE_CUR_VER_FLAG)
        ];
    }


    private refreshDataTypeAutocomplete() {
        const rtc = this.documentService.selectedDocument.item.$rtc;
        this.dataTypeService.getDataTypes(rtc.runtimeContext(), [DataTypeService.ANYTYPE]).subscribe(types => {
            this.dataTypeDataWrapper.values = [
                ...MemberVariableDetailsComponent.PRIMITIVE_TYPES.map(primitive => XcOptionItemTranslate(this.i18n, primitive)),
                ...types.map(type => XcOptionItemString(type.typeFqn.uniqueKey))
            ];
        });
    }


    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    @ViewChild('dataTypeAutocomplete', {static: false, read: XcFormAutocompleteComponent})
    set dataTypeAutocomplete(value: XcFormAutocompleteComponent) {
        this.untilDestroyed(value?.focus)?.pipe(filter(() => !value.disabled)).subscribe(() => this.refreshDataTypeAutocomplete());
    }


    get memberVariable(): XoMemberVariable {
        return this.getModel() as XoMemberVariable;
    }


    @Input()
    set memberVariable(value: XoMemberVariable) {
        this.setModel(value);
        if (value) {
            this.dataTypeDataWrapper.preset(v => XcOptionItemStringOrUndefined(v));
            this.refreshStorableRoleAutocomplete();
        }
    }


    get isList(): boolean {
        return this.memberVariable.isList;
    }


    set isList(value: boolean) {
        if (this.memberVariable.isList !== value) {
            this.memberVariable.isList = value;
            this.performMemberVariableChange(new XoChangeMemberVariableIsListRequest(undefined, value));
        }
    }


    get primitive(): boolean {
        return !!this.memberVariable.primitiveType;
    }


    get multiplicity(): string {
        return this.isList ? 'n' : '1';
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


    performMemberVariableChange(request: XoRequest, id = this.memberVariable.id) {
        this.performAction({
            type: ModellingActionType.change,
            objectId: id,
            request
        });
    }


    openComplexDataType() {
        const rtc = (this.memberVariable.$rtc ?? this.dataTypeRTC).runtimeContext();
        const fqn = this.memberVariable.toFqn();
        this.documentService.loadDataType(rtc, fqn);
    }
}
