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
import { XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { BehaviorSubject, Observable } from 'rxjs';

import { DeploymentState, XmomObjectType } from '../api/xmom-types';
import { XoDataTypeTypeLabelArea } from './data-type-type-label-area.model';
import { XoDetailsArea } from './details-area.model';
import { XoGlobalStorablePropertyArea } from './global-storable-property-area.model';
import { XoJavaSharedLibrariesArea } from './java-shared-libraries-area.model';
import { XoLibrariesArea } from './libraries-area.model';
import { XoMemberMethodArea } from './member-method-area.model';
import { XoMemberVariableArea } from './member-variable-area.model';
import { XoMetaTagArea } from './meta-tag-area.model';
import { XoMethod } from './method.model';
import { XoModellingItem } from './modelling-item.model';
import { XoTextArea } from './text-area.model';
import { XoXmomItem } from './xmom-item.model';


@XoObjectClass(XoXmomItem, 'xmcp.processmodeller.datatypes', 'DataType')
export class XoDataType extends XoXmomItem {

    static readonly GLOBAL_STORABLE_PROPERTIES_AREA = 'globalStorableProperties';
    static readonly STORABLE_PROPERTIES_AREA        = 'storableProperties';
    static readonly INHERITED_METHODS_AREA          = 'inheritedMethods';
    static readonly OVERRIDDEN_METHODS_AREA         = 'overriddenMethods';
    static readonly MEMBER_METHODS_AREA             = 'memberMethods';


    @XoProperty(XoDataTypeTypeLabelArea)
    @XoTransient()
    typeInfoArea: XoDataTypeTypeLabelArea;

    @XoProperty(XoGlobalStorablePropertyArea)
    @XoTransient()
    globalStorablePropertyArea: XoGlobalStorablePropertyArea;

    @XoProperty(XoLibrariesArea)
    @XoTransient()
    librariesArea: XoLibrariesArea;

    @XoProperty(XoJavaSharedLibrariesArea)
    @XoTransient()
    javaSharedLibrariesArea: XoJavaSharedLibrariesArea;

    @XoProperty(XoTextArea)
    @XoTransient()
    documentationArea: XoTextArea;

    @XoProperty(XoMemberVariableArea)
    @XoTransient()
    detailsArea: XoDetailsArea;

    @XoProperty(XoMemberVariableArea)
    @XoTransient()
    metaTagArea: XoMetaTagArea;

    @XoProperty(XoMemberVariableArea)
    @XoTransient()
    inheritedVarsArea: XoMemberVariableArea;

    @XoProperty(XoMemberVariableArea)
    @XoTransient()
    memberVarsArea: XoMemberVariableArea;

    @XoProperty(XoMemberMethodArea)
    @XoTransient()
    inheritedMethodsArea: XoMemberMethodArea;

    @XoProperty(XoMemberMethodArea)
    @XoTransient()
    overriddenMethodsArea: XoMemberMethodArea;

    @XoProperty(XoMemberMethodArea)
    @XoTransient()
    memberMethodsArea: XoMemberMethodArea;

    private readonly _revisionSubject  = new BehaviorSubject<number>(null);

    deploymentState: DeploymentState;
    saved: boolean;
    modified: boolean;


    constructor(_ident?: string) {
        super(_ident);
        this.type = XmomObjectType.DataType;
    }


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            switch (area.name) {
                case XoModellingItem.TYPE_INFO_AREA:             this.typeInfoArea               = area as XoDataTypeTypeLabelArea; break;
                case XoModellingItem.DOCUMENTATION_AREA_NAME:    this.documentationArea          = area as XoTextArea; break;
                case XoXmomItem.LIBS_AREA:                       this.librariesArea              = area as XoLibrariesArea; break;
                case XoXmomItem.SHARED_LIBS_AREA:                this.javaSharedLibrariesArea    = area as XoJavaSharedLibrariesArea; break;
                case XoXmomItem.INHERITED_VARS_AREA:             this.inheritedVarsArea          = area as XoMemberVariableArea; break;
                case XoXmomItem.MEMBER_VARS_AREA:                this.memberVarsArea             = area as XoMemberVariableArea; break;
                case XoDataType.META_TAG_AREA_NAME:              this.metaTagArea                = area as XoMetaTagArea; break;
                case XoDataType.GLOBAL_STORABLE_PROPERTIES_AREA: this.globalStorablePropertyArea = area as XoGlobalStorablePropertyArea; break;
                case XoDataType.OVERRIDDEN_METHODS_AREA:         this.overriddenMethodsArea      = area as XoMemberMethodArea; break;
                case XoDataType.MEMBER_METHODS_AREA:             this.memberMethodsArea          = area as XoMemberMethodArea; break;
                case XoDataType.INHERITED_METHODS_AREA:
                    this.inheritedMethodsArea = area as XoMemberMethodArea;
                    this.inheritedMethodsArea.items.data.forEach((method: XoMethod) => {
                        method.readonlyImplementation = true;
                        method.isInheritedInstanceMethod = true;
                    });
                    break;
            }
        }

        // global Storable property area must exist - so instantiate, if it hasn't been set
        this.globalStorablePropertyArea ??= new XoGlobalStorablePropertyArea();
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
