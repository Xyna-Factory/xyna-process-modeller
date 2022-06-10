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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ApiService, FullQualifiedName, RuntimeContext, XoDescriber, XoJson, XoStructureType } from '@zeta/api';

import { Observable } from 'rxjs/';
import { map, switchMap } from 'rxjs/operators';

import { XoServiceReferenceCandidates } from '../xo/service-reference-candidates.model';


@Injectable()
export class DataTypeService {

    static ANYTYPE = 'base.AnyType';
    static STORABLE = 'xnwh.persistence.Storable';
    static CORE_EXCEPTION = 'core.exception.Exception';


    constructor(
        private readonly http: HttpClient,
        private readonly apiService: ApiService
    ) {
    }


    private getSubtypes(fqn: FullQualifiedName, rtc: RuntimeContext, excludeFqns: string[]): Observable<XoStructureType[]> {
        const describer: XoDescriber = {fqn, rtc};
        return this.apiService.getSubtypes(rtc, [describer]).get(describer).pipe(
            map(structureTypes => structureTypes.filter(structureType => !excludeFqns.includes(structureType.typeFqn.uniqueKey)))
        );
    }


    /**
     * Returns all data types (i.e. data types extending ANYTYPE)
     */
    getStorableTypes(rtc: RuntimeContext, excludeFqns: string[] = []): Observable<XoStructureType[]> {
        return this.getSubtypes(FullQualifiedName.decode(DataTypeService.STORABLE), rtc, excludeFqns);
    }


    /**
     * Returns all data types (i.e. data types extending ANYTYPE)
     */
    getDataTypes(rtc: RuntimeContext, excludeFqns: string[] = []): Observable<XoStructureType[]> {
        return this.getSubtypes(FullQualifiedName.decode(DataTypeService.ANYTYPE), rtc, excludeFqns);
    }


    /**
     * Returns all exception types (i.e. data types extending CORE_EXCEPTION)
     */
    getExceptionTypes(rtc: RuntimeContext, excludeFqns: string[] = []): Observable<XoStructureType[]> {
        return this.getSubtypes(FullQualifiedName.decode(DataTypeService.CORE_EXCEPTION), rtc, excludeFqns);
    }


    /**
     * Returns all data types that are no exception types (i.e. data types extending ANYTYPE but not CORE_EXCEPTION)
     */
    getDataTypesWithoutExceptionTypes(rtc: RuntimeContext, excludeFqns: string[] = []): Observable<XoStructureType[]> {
        return this.getExceptionTypes(rtc, excludeFqns).pipe(
            switchMap(exceptionStructureTypes => this.getDataTypes(rtc, excludeFqns).pipe(
                map(structureTypes => structureTypes.filter(
                    structureType => !exceptionStructureTypes.find(exceptionStructureType =>
                        structureType.typeRtc?.equals(exceptionStructureType.typeRtc) &&
                        structureType.typeFqn?.equals(exceptionStructureType.typeFqn)
                    )
                ))
            ))
        );
    }


    /**
     * Get all references of a member function of a datatype
     * @param fqn Full qualified name of the datatype
     * @param rtc Runtime context of the datatype
     * @param id Member function id
     */
    getReferencesOfMemberFunction(fqn: FullQualifiedName, rtc: RuntimeContext, id: string): Observable<XoServiceReferenceCandidates> {
        const url = `runtimeContext/${rtc.uniqueKey}/xmom/datatypes/${fqn.path}/${fqn.name}/objects/${id}/referenceCandidates`;
        return this.http.get<XoJson>(url).pipe(
            map(data => new XoServiceReferenceCandidates().decode(data))
        );
    }

}
