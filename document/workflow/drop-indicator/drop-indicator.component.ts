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
import { Component, ElementRef, OnInit } from '@angular/core';

import { ModDragAndDropService } from '../shared/drag-and-drop/mod-drag-and-drop.service';


@Component({
    selector: 'drop-indicator',
    templateUrl: './drop-indicator.component.html',
    styleUrls: ['./drop-indicator.component.scss'],
    standalone: false
})
export class DropIndicatorComponent implements OnInit {

    constructor(private readonly elementRef: ElementRef, private readonly dndService: ModDragAndDropService) {
    }


    ngOnInit() {
        this.dndService.setDropIndicator(this.elementRef.nativeElement);
        if (this.elementRef.nativeElement.parentElement) {
            this.elementRef.nativeElement.parentElement.removeChild(this.elementRef.nativeElement);
        }
    }

}
