/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { XoMetaTagArea } from '@pmod/xo/meta-tag-area.model';

import { DatatypeTabComponent, MetaTabData } from '../datatype-tab.component';


@Component({
    templateUrl: './meta-tab.component.html',
    styleUrls: ['./meta-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class MetaTabComponent extends DatatypeTabComponent<MetaTabData> {

    get metaTagArea(): XoMetaTagArea {
        return this.tabData?.metaTagArea;
    }

    get objectIdKey(): string {
        return this.tabData?.objectIdKey;
    }

    get objectId(): string {
        return this.tabData?.objectId;
    }

}
