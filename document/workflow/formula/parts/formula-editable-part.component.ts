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
import { Component, EventEmitter, HostListener, Output } from '@angular/core';

import { FormulaPart } from '../../../../xo/util/formula-parts/formula-part';
import { FormulaPartComponent } from './formula-part.component';


@Component({ template: '' })
export class FormulaEditablePartComponent extends FormulaPartComponent {

    /**
     * Called always at the beginning of editing this part
     */
    @Output('startedEditing')
    readonly startedEditing = new EventEmitter<FormulaPart>();

    /**
     * Called only if the editing was accepted (e. g. via ENTER key)
     */
    @Output('acceptedEditing')
    readonly acceptedEditing = new EventEmitter<FormulaPart>();

    /**
     * Called always at the end of editing this part
     */
    @Output('finishedEditing')
    readonly finishedEditing = new EventEmitter<FormulaPart>();


    startEditing() {
        this.startedEditing.emit(this.formulaPart);
    }


    acceptEditing() {
        this.acceptedEditing.emit(this.formulaPart);
    }


    finishEditing(event?: FocusEvent) {
        this.finishedEditing.emit(this.formulaPart);
    }


    setFocus() {
    }


    @HostListener('keydown', ['$event'])
    protected keyDown(event: KeyboardEvent) {
        event.stopPropagation();
    }


    get editing(): boolean {
        return false;
    }
}
