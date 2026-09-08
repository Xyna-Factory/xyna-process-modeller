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
import { Component, forwardRef, Input, ChangeDetectionStrategy } from '@angular/core';

import { XoParallelism } from '../../../xo/parallelism.model';
import { ContentAreaComponent } from '../content-area/content-area.component';
import { ModellingItemComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'parallelism',
    templateUrl: './parallelism.component.html',
    styleUrls: ['./parallelism.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [forwardRef(() => ContentAreaComponent)]
})
export class ParallelismComponent extends ModellingItemComponent {

    // TODO: Skipped for migration because:
    //  Accessor inputs cannot be migrated as they are too complex.
    @Input()
    set parallelism(value: XoParallelism) {
        this.setModel(value);
    }


    get parallelism(): XoParallelism {
        return this.getModel() as XoParallelism;
    }
}
