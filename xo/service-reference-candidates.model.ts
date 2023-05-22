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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoXMOMItemReferenceArray } from './xmomitem-reference.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.datatypemodeller', 'ServiceReferenceCandidates')
export class XoServiceReferenceCandidates extends XoObject {


    @XoProperty(XoXMOMItemReferenceArray)
    candidates: XoXMOMItemReferenceArray = new XoXMOMItemReferenceArray();


}

@XoArrayClass(XoServiceReferenceCandidates)
export class XoServiceReferenceCandidatesArray extends XoArray<XoServiceReferenceCandidates> {
}
