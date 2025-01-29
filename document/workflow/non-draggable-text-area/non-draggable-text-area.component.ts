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
import { AfterViewInit, Component, HostListener, Input } from '@angular/core';

import { ModellingObjectComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'non-draggable-text-area',
    templateUrl: './non-draggable-text-area.component.html',
    styleUrls: ['./non-draggable-text-area.component.scss'],
    standalone: false
})
export class NonDraggableTextAreaComponent extends ModellingObjectComponent implements AfterViewInit {

    private _text = '';
    rows = 3;
    cols = 40;


    ngAfterViewInit(): void {
        this.elementRef.nativeElement.draggable = 'false';
    }


    @Input()
    set text(value: string) {
        this._text = value;

        // evaluate rows and cols
        const lines = this.text.split(/\n/);
        this.rows = lines.length + 1;
        this.cols = lines
            .map(line => line.length)
            .reduce((length: number, max: number) => (length > max) ? length : max);
    }


    get text(): string {
        return this._text;
    }


    @HostListener('dragstart', ['$event'])
    dragStart(event: Event) {
        event.preventDefault();
    }
}
