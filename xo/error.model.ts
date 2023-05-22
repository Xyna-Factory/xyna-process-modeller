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

import { XoErrorKeyValuePair, XoErrorKeyValuePairArray } from './error-key-value-pair.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes', 'Error')
export class XoError extends XoObject {

    @XoProperty()
    message: string;

    @XoProperty()
    errorCode: string;

    @XoProperty()
    exceptionMessage: string;

    @XoProperty(XoErrorKeyValuePairArray)
    params: XoErrorKeyValuePairArray;


    get stacktrace(): string {
        let stackTracePair: XoErrorKeyValuePair;
        if (this.params) {
            stackTracePair = this.params.data.find(param => param.key.toLowerCase() === 'stacktrace');
        }
        return stackTracePair ? stackTracePair.value : '';
    }
}


@XoArrayClass(XoError)
export class XoErrorArray extends XoArray<XoError> {
}
