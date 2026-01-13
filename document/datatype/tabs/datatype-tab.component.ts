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
import { ChangeDetectorRef, Component, Injector, OnDestroy, Optional } from '@angular/core';

import { ModellingActionType } from '@pmod/api/xmom.service';
import { DocumentService } from '@pmod/document/document.service';
import { DocumentItem, DocumentModel } from '@pmod/document/model/document.model';
import { ModRelativeHoverSide } from '@pmod/document/workflow/shared/drag-and-drop/mod-drag-and-drop.service';
import { TriggeredAction } from '@pmod/document/workflow/shared/modelling-object.component';
import { XoChangeLabelRequest } from '@pmod/xo/change-label-request.model';
import { XoChangeMemberVariableIsListRequest } from '@pmod/xo/change-member-variable-is-list-request.model';
import { XoDataType } from '@pmod/xo/data-type.model';
import { XoDynamicMethod } from '@pmod/xo/dynamic-method.model';
import { XoMemberVariable } from '@pmod/xo/member-variable.model';
import { XoMetaTagArea } from '@pmod/xo/meta-tag-area.model';
import { XoMethod } from '@pmod/xo/method.model';
import { XoModellingItem } from '@pmod/xo/modelling-item.model';
import { XoMoveModellingObjectRequest } from '@pmod/xo/move-modelling-object-request.model';
import { XoRequest } from '@pmod/xo/request.model';
import { XoRuntimeContext } from '@pmod/xo/runtime-context.model';
import { XoStaticMethod } from '@pmod/xo/static-method.model';
import { XoTextArea } from '@pmod/xo/text-area.model';
import { FullQualifiedName } from '@zeta/api';
import { XcTabComponent } from '@zeta/xc';
import { XoDefinitionBundle } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';

import { Observable, Subject, takeUntil } from 'rxjs';


export interface DocumentTabData<D> {
    documentModel: DocumentModel<DocumentItem>;
    performAction: (action: TriggeredAction) => void;
    readonly: boolean;
    update: Observable<D>;
}


export interface DocumentationTabData {
    documentationArea: XoTextArea;
}

export interface MetaTabData {
    metaTagArea: XoMetaTagArea;
    objectIdKey: string;
    objectId: string;
}

export interface PluginTabData extends DocumentTabData<XoDataType> {
    bundle: XoDefinitionBundle;
}

export interface VariableTabData {
    variable: XoMemberVariable;
    dataTypeRTC: XoRuntimeContext;
}

export interface MethodTabData {
    method: XoMethod;
    
}


/**
 * Base class for tabs in Datatype view
 */
@Component({
    template: '',
    standalone: false
})
export abstract class DatatypeTabComponent<D, E extends DocumentTabData<D> = DocumentTabData<D>> extends XcTabComponent<void, E> implements OnDestroy {

    private readonly destroySubject = new Subject<void>();
    protected tabData: D;

    get readonly(): boolean {
        return this.injectedData.readonly;
    }

    get documentModel(): DocumentModel<DocumentItem> {
        return this.injectedData.documentModel;
    }

    constructor(
        protected readonly documentService: DocumentService,
        protected readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(injector);

        this.untilDestroyed(this.injectedData.update).subscribe(data => {
            this.tabData = data;
            this.cdr.markForCheck();
        });
    }

    ngOnDestroy() {
        this.destroySubject.next();
        this.destroySubject.complete();
    }


    protected untilDestroyed<T>(observable: Observable<T>): Observable<T> {
        return observable?.pipe(takeUntil(this.destroySubject));
    }


    performAction(action: TriggeredAction): void {
        this.injectedData.performAction(action);
    }
}

@Component({
    template: '',
    standalone: false
})
export abstract class DatatypeDetailsTabComponent extends DatatypeTabComponent<XoDataType> {


    get dataType(): XoDataType {
        return this.tabData;
    }

}

@Component({
    template: '',
    standalone: false
})
export abstract class DatatypeVariableTabComponent extends DatatypeTabComponent<VariableTabData> {


    get memberVariable(): XoMemberVariable {
        return this.tabData?.variable;
    }


    get isList(): boolean {
        return this.memberVariable?.isList;
    }


    set isList(value: boolean) {
        if (this.memberVariable && this.memberVariable.isList !== value) {
            this.memberVariable.isList = value;
            this.performMemberVariableChange(new XoChangeMemberVariableIsListRequest(undefined, value));
        }
    }


    get primitive(): boolean {
        return !!this.memberVariable.primitiveType || this.memberVariable.primitiveType === undefined;
    }


    get multiplicity(): string {
        return this.isList ? 'n' : '1';
    }


    performMemberVariableChange(request: XoRequest, id = this.memberVariable.id) {
        this.performAction({
            type: ModellingActionType.change,
            objectId: id,
            request
        });
    }


    openComplexDataType() {
        const rtc = (this.memberVariable?.$rtc ?? this.tabData?.dataTypeRTC)?.runtimeContext();
        const fqn = this.memberVariable?.toFqn();
        this.documentService.loadDataType(rtc, fqn);
    }
}

@Component({
    template: '',
    standalone: false
})
export abstract class DatatypeMethodTabComponent extends DatatypeTabComponent<MethodTabData> {


    get method(): XoMethod {
        return this.tabData?.method;
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
        return this.method.implementationType === XoMethod.IMPL_TYPE_CODED_SERVICE ||
            this.method.implementationType === XoMethod.IMPL_TYPE_CODED_SERVICE_PYTHON ||
            this.method.implementationType === XoMethod.IMPL_TYPE_ABSTRACT;
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


    performMethodChange(request: XoRequest, id = this.method.id) {
        this.performAction({
            type: ModellingActionType.change,
            objectId: id,
            request
        });
    }


    createWorkflow() {
        const input = this.method.inputArea.items.data as XoModellingItem[];
        const output = this.method.outputArea.items.data as XoModellingItem[];

        this.documentService.newWorkflow(this.method.label, false, input, output);
    }


    openReferencedWorkflow() {
        if (this.method instanceof XoDynamicMethod && this.method.reference) {
            this.documentService.loadWorkflow(this.method.toRtc(), FullQualifiedName.decode(this.method.reference));
        }
    }
}
