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
import { XoLibrariesArea } from './libraries-area.model';
import { XoJavaSharedLibrariesArea } from './java-shared-libraries-area.model';
import { XoMemberMethodArea } from './member-method-area.model';
import { XoModellingItem } from './modelling-item.model';
import { XoServiceGroupTypeLabelArea } from './service-group-type-label-area.model';
import { XoXmomItem } from './xmom-item.model';


@XoObjectClass(XoXmomItem, 'xmcp.processmodeller.datatypes', 'ServiceGroup')
export class XoServiceGroup extends XoXmomItem {

    static readonly METHODS_AREA = 'methods';


    @XoProperty(XoServiceGroupTypeLabelArea)
    @XoTransient()
    typeInfoArea: XoServiceGroupTypeLabelArea;

    @XoProperty(XoLibrariesArea)
    @XoTransient()
    librariesArea: XoLibrariesArea;

    @XoProperty(XoJavaSharedLibrariesArea)
    @XoTransient()
    javaSharedLibrariesArea: XoJavaSharedLibrariesArea;

    @XoProperty(XoMemberMethodArea)
    @XoTransient()
    methodsArea: XoMemberMethodArea;

    private readonly _revisionSubject = new BehaviorSubject<number>(null);

    deploymentState: DeploymentState;
    saved: boolean;
    modified: boolean;


    constructor(_ident?: string) {
        super(_ident);
        this.type = XmomObjectType.ServiceGroup;
    }


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            switch (area.name) {
                case XoModellingItem.TYPE_INFO_AREA: this.typeInfoArea            = area as XoServiceGroupTypeLabelArea; break;
                case XoXmomItem.LIBS_AREA:           this.librariesArea           = area as XoLibrariesArea; break;
                case XoXmomItem.SHARED_LIBS_AREA:    this.javaSharedLibrariesArea = area as XoJavaSharedLibrariesArea; break;
                // TODO: remove backwards compatibility
                case 'methodsArea':
                // TODO: rename to memberMethodsArea (same as in data type)
                // eslint-disable-next-line no-fallthrough
                case XoServiceGroup.METHODS_AREA:    this.methodsArea             = area as XoMemberMethodArea; break;
            }
        }
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
