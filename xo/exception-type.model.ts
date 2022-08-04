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
import { XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { BehaviorSubject, Observable } from 'rxjs';

import { DeploymentState, XmomObjectType } from '../api/xmom-types';
import { XoDataTypeTypeLabelArea } from './data-type-type-label-area.model';
import { XoExceptionMessagesArea } from './exception-messages-area.model';
import { XoMemberVariableArea } from './member-variable-area.model';
import { XoModellingItem } from './modelling-item.model';
import { XoTextArea } from './text-area.model';
import { XoXmomItem } from './xmom-item.model';


@XoObjectClass(XoXmomItem, 'xmcp.processmodeller.datatypes', 'ExceptionType')
export class XoExceptionType extends XoXmomItem {

    static readonly EXCEPTION_MESSAGES = 'exceptionMessages';

    @XoProperty(XoDataTypeTypeLabelArea)
    @XoTransient()
    typeInfoArea: XoDataTypeTypeLabelArea;

    @XoProperty(XoExceptionMessagesArea)
    @XoTransient()
    exceptionMessageArea: XoExceptionMessagesArea;

    @XoProperty(XoTextArea)
    @XoTransient()
    documentationArea: XoTextArea;

    @XoProperty(XoMemberVariableArea)
    @XoTransient()
    inheritedVarsArea: XoMemberVariableArea;

    @XoProperty(XoMemberVariableArea)
    @XoTransient()
    memberVarsArea: XoMemberVariableArea;

    private readonly _revisionSubject  = new BehaviorSubject<number>(null);

    deploymentState: DeploymentState;
    saved: boolean;
    modified: boolean;


    constructor(_ident?: string) {
        super(_ident);
        this.type = XmomObjectType.ExceptionType;
    }


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            switch (area.name) {
                case XoModellingItem.TYPE_INFO_AREA: this.typeInfoArea = area as XoDataTypeTypeLabelArea; break;
                case XoExceptionType.EXCEPTION_MESSAGES: this.exceptionMessageArea = area as XoExceptionMessagesArea; break;
                case XoModellingItem.DOCUMENTATION_AREA_NAME: this.documentationArea = area as XoTextArea; break;

                case XoXmomItem.INHERITED_VARS_AREA: this.inheritedVarsArea = area as XoMemberVariableArea; break;
                case XoXmomItem.MEMBER_VARS_AREA: this.memberVarsArea = area as XoMemberVariableArea; break;
            }
        }
    }


    hasBaseType(): boolean {
        return !!this.typeInfoArea?.baseType;
    }


    get revision(): number {
        return this._revisionSubject.value;
    }


    set revision(value: number) {
        this._revisionSubject.next(value);
    }


    get revisionChange(): Observable<number> {
        return this._revisionSubject.asObservable();
    }
}
