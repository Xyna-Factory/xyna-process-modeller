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
import { Injectable } from '@angular/core';

import { ApiService, RuntimeContext } from '@zeta/api';
import { XcAutocompleteDataWrapper, XcOptionItem } from '@zeta/xc';

import { BehaviorSubject, Observable } from 'rxjs/';

import { XmomService } from '../api/xmom.service';


@Injectable()
export class FactoryService {

    /**
     * Runtime Context used by Factory Navigation and Search
     */
    private readonly runtimeContextSubject = new BehaviorSubject<RuntimeContext>(null);

    /**
     * If the factory's RTC equals the globally set RTC, the factory's RTC has to change along with the global RTC
     */
    private equalsGlobalRTC = true;

    private _runtimeContextDataWrapper: XcAutocompleteDataWrapper;


    constructor(private readonly apiService: ApiService, private readonly xmomService: XmomService) {
        this._runtimeContextDataWrapper = new XcAutocompleteDataWrapper(
            () => this.runtimeContextSubject.value,
            value => {
                // factory RTC changes
                this.runtimeContext = value;
            }
        );

        // global RTC changes
        this.xmomService.runtimeContextChange.subscribe(rtc => {
            if (this.equalsGlobalRTC) {
                // change factory's RTC along with global RTC
                this.runtimeContext = rtc;
                this.runtimeContextDataWrapper.update();
            }
        });

        this.refresh();
    }


    refresh() {
        this.apiService.getRuntimeContexts().subscribe(runtimeContexts => {
            // set new values to data wrapper
            this._runtimeContextDataWrapper.values = runtimeContexts.map(rtc => <XcOptionItem>{
                name: rtc.toString(),
                value: rtc.toRuntimeContext()
            });
            // trigger change to propagate update
            this.runtimeContextSubject.next(this.runtimeContext);
        });
    }

    resetToActiveWorkspace() {
        this.runtimeContext = this.xmomService.runtimeContext;
    }


    get runtimeContextChange(): Observable<RuntimeContext> {
        return this.runtimeContextSubject.asObservable();
    }


    get runtimeContext(): RuntimeContext {
        return this.runtimeContextSubject.getValue();
    }


    set runtimeContext(value: RuntimeContext) {
        this.runtimeContextSubject.next(value);
        this.equalsGlobalRTC = value ? value.equals(this.xmomService.runtimeContext) : true;
    }


    get runtimeContextDataWrapper(): XcAutocompleteDataWrapper {
        return this._runtimeContextDataWrapper;
    }
}
