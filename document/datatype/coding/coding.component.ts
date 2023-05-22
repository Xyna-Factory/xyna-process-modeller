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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { XoMethod } from '../../../xo/method.model';


@Component({
    selector: 'coding',
    templateUrl: './coding.component.html',
    styleUrls: ['./coding.component.scss']
})
export class CodingComponent {

    private _method: XoMethod;

    @Input()
    set method(value: XoMethod) {
        this._method = value;
    }

    get method(): XoMethod {
        return this._method;
    }

    set implementation(value: string) {
        if (this.method && this.implementation === value) {
            this.method.implementation = value;
            this.implementationChange.emit(value);
        }
    }

    get implementation(): string {
        return this.method ? this.method.implementation : '';
    }

    @Input()
    readonly: boolean;

    get isAbstract(): boolean {
        return this.method ? this.method.implementationType === XoMethod.IMPL_TYPE_ABSTRACT : true;
    }

    @Output()
    readonly implementationChange = new EventEmitter<string>();

    @Output()
    // eslint-disable-next-line @angular-eslint/no-output-native
    readonly blur = new EventEmitter<FocusEvent>();

    codingBlur(event: FocusEvent) {
        this.blur.emit(event);
    }

}
