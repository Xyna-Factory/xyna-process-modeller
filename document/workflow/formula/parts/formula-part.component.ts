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
import { Component, Input } from '@angular/core';

import { FormulaPart } from '../../../../xo/util/formula-parts/formula-part';


export interface FormulaChildComponent {
    getChildren(): HTMLElement[];
}


@Component({
    template: '',
    standalone: false
})
export class FormulaPartComponent {

    private _formulaPart: FormulaPart;


    @Input('formula-part')
    set formulaPart(value: FormulaPart) {
        this._formulaPart = value;
    }


    get formulaPart(): FormulaPart {
        return this._formulaPart;
    }
}
