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
import { XoObjectClass, XoProperty } from '@zeta/api';

import { XoFactoryItemArray } from './factory-item.model';
import { XoXmomItemResponse } from './xmom-item-response.model';


export enum RelationTypeEnum {
    calledBy = 'called-by',
    extends0 = 'extends',
    extendedBy0 = 'extended-by',
    inputOf0 = 'input-of',
    instanceServiceReferenceOf = 'instance-service-reference-of',
    outputOf0 = 'output-of',
    hasMemberOf = 'has-member-of',
    isMemberOf = 'is-member-of',
    thrownBy0 = 'thrown-by',
    usedIn0 = 'used-in',

    calls = 'calls',
    exceptions = 'exceptions',
    needs = 'needs',
    produces = 'produces'
}

@XoObjectClass(XoXmomItemResponse, 'xmcp.processmodeller.datatypes.response', 'GetRelationsResponse')
export class XoGetXmomRelationsResponse extends XoXmomItemResponse {
    @XoProperty(XoFactoryItemArray) 'calledBy': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'extends0': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'extendedBy0': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'inputOf0': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'instanceServiceReferenceOf': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'outputOf0': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'hasMemberOf': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'isMemberOf': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'thrownBy0': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'usedIn0': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'inputOf': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'calls': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'exceptions': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'needs': XoFactoryItemArray;

    @XoProperty(XoFactoryItemArray) 'produces': XoFactoryItemArray;
}
