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

import { XoExpressionVariable } from './expression-variable.model';

export class RecursiveStructurePart {

    private _child: RecursiveStructurePart;
    private _fqn: string;

    constructor(public path: string) {
    }

    get child(): RecursiveStructurePart {
        return this._child;
    }

    set child(child: RecursiveStructurePart) {
        this._child = child;
    }

    get fqn(): string {
        return this._fqn;
    }

    set fqn(fqn: string) {
        this._fqn = fqn;
    }
}

export interface RecursiveStructure {

    getVariable(): XoExpressionVariable;

    getRecursiveStructure(): RecursiveStructurePart;
}
