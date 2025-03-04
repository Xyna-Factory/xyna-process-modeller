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
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { XoFormula } from '@pmod/xo/formula.model';
import { FormulaFunctionGroup, FormulaPartFunction } from '@pmod/xo/util/formula-parts/formula-part-function';

import { XcAutocompleteDataWrapper, XcFormAutocompleteComponent } from '@zeta/xc';
import { FormulaChildComponent } from '../formula-part.component';



@Component({
    selector: 'formula-proxy',
    templateUrl: './formula-proxy.component.html',
    styleUrls: ['./formula-proxy.component.scss'],
    standalone: false
})
export class FormulaProxyComponent implements AfterViewInit, FormulaChildComponent {

    @ViewChild(XcFormAutocompleteComponent, {static: false})
    private readonly _proxyInput: XcFormAutocompleteComponent;
    private _optionElements: HTMLElement[] = [];
    private _selection: string;

    @Input()
    formula: XoFormula;

    @Output()
    readonly selectionChange = new EventEmitter<string>();

    proxyDataWrapper = new XcAutocompleteDataWrapper<string>(
        () => null,
        (value: string) => {
            this._selection = value;
        },
        []
    );


    constructor(readonly elementRef: ElementRef) {
        elementRef.nativeElement.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.stopPropagation();
            }
        });
    }


    ngAfterViewInit() {
        const functions = FormulaPartFunction.functionsForGroup(this.formula?.allowedFunctions ?? FormulaFunctionGroup.none);
        this.proxyDataWrapper.values = functions.map(f => ({ name: f.label, value: f.xfl }));
        this._proxyInput.setFocus();
    }


    opened() {
        this._optionElements = this._proxyInput?.trigger?.autocomplete?.options?.map(option => option._getHostElement());
    }


    closed() {
        this._optionElements = [];
        this.selectionChange.emit(this._selection);
    }


    getChildren(): HTMLElement[] {
        return this._optionElements;
    }
}
