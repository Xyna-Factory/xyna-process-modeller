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
import { Component, HostBinding, HostListener, inject, OnDestroy } from '@angular/core';

import { SelectionService } from '../../selection.service';
import { ModellingItemComponent } from './modelling-object.component';


/**
 * Base class for all selectable modelling object components
 */
@Component({ template: '' })
export class SelectableModellingObjectComponent extends ModellingItemComponent implements OnDestroy {

    protected readonly selectionService = inject(SelectionService);

    @HostBinding('class.selected')
    protected _selected = false;


    constructor( ) {
        super();

        this.untilDestroyed(this.selectionService.selectionChange).subscribe(
            selectedObject => this.selectionChanged(selectedObject)
        );
    }


    ngOnDestroy(): void {
        super.ngOnDestroy();

        if (this.selected) {
            this.selectionService.clearSelection();
        }
    }


    doubleClick() {
        this.selectionService.doubleClick(this);
    }


    select() {
        this.selectionService.selectedObject = this;
    }


    selectionChanged(selectedObject: SelectableModellingObjectComponent) {
        this._selected = (selectedObject === this);
    }


    get selected(): boolean {
        return this._selected;
    }


    @HostListener('click', ['$event'])
    click(event: MouseEvent) {
        this.select();
        event.stopPropagation();
    }
}
