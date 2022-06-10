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

import { ChangeDetectorRef } from '@angular/core';

import { filter } from 'rxjs/operators';


export class CommonNavigationComponent {

    /** true when the component is visible */
    active: boolean;

    /**
     * @description Used to handle subscriptions on a CommonNavigationComponent
     * @example
     * this.documentService.selectionChange.pipe(this.whileActive).subscribe(document => {
     *    console.log('This will only be printed when the component is active');
     * });
    */
    protected whileActive = filter(() => this.active);


    constructor(private readonly cdr: ChangeDetectorRef) {
        this.onHide();
    }


    onShow() {
        this.cdr.reattach();
        this.active = true;
    }


    onHide() {
        this.cdr.detach();
        this.active = false;
    }


    updateView() {
        this.cdr.markForCheck();
    }
}
