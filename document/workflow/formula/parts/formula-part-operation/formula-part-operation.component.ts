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
import { Component } from '@angular/core';

import { FormulaPartComponent } from '../formula-part.component';


@Component({
    selector: 'formula-part-operation',
    templateUrl: './formula-part-operation.component.html',
    styleUrls: ['./formula-part-operation.component.scss'],
    standalone: false
})
export class FormulaPartOperationComponent extends FormulaPartComponent {
    get text(): string {
        switch (this.formulaPart.part) {
            case '=': return ':=';
            case '==': return '=';
            case '>=': return '≥';
            case '<=': return '≤';
            case '!=': return '≠';
            case '&&': return 'AND';
            case '||': return 'OR';
            default: return this.formulaPart.part;
        }
    }
}
