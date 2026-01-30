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

import { VariableAreaServiceComponent } from './variable-area-service.component';
import { ModDropAreaDirective } from '../shared/drag-and-drop/mod-drop-area.directive';
import { NgFor } from '@angular/common';
import { VariableComponent } from '../variable/variable.component';
import { ModDraggableDirective } from '../shared/drag-and-drop/mod-draggable.directive';


@Component({
    selector: 'variable-area-choice',
    templateUrl: './variable-area.component.html',
    styleUrls: ['./variable-area.component.scss', './variable-area-service.component.scss', './variable-area-choice.component.scss'],
    imports: [ModDropAreaDirective, NgFor, VariableComponent, ModDraggableDirective]
})
export class VariableAreaChoiceComponent extends VariableAreaServiceComponent {
}
