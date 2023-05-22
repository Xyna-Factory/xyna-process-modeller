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
import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { SelectableModellingObjectComponent } from './workflow/shared/selectable-modelling-object.component';


@Injectable()
export class SelectionService {

    private readonly _doubleClickObjectSubject = new Subject<SelectableModellingObjectComponent>();
    private readonly _selectedObjectSubject = new BehaviorSubject<SelectableModellingObjectComponent>(null);


    get doubleClickObject(): Observable<SelectableModellingObjectComponent> {
        return this._doubleClickObjectSubject.asObservable();
    }


    doubleClick(object: SelectableModellingObjectComponent) {
        this._doubleClickObjectSubject.next(object);
    }


    get selectionChange(): Observable<SelectableModellingObjectComponent> {
        return this._selectedObjectSubject.asObservable();
    }


    get selectedObject(): SelectableModellingObjectComponent {
        return this._selectedObjectSubject.value;
    }


    set selectedObject(value: SelectableModellingObjectComponent) {
        if (value !== this.selectedObject) {
            this._selectedObjectSubject.next(value);
        }
    }


    clearSelection() {
        this.selectedObject = null;
    }
}
