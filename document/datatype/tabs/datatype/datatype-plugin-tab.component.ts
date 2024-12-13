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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Optional } from '@angular/core';

import { DocumentService } from '@pmod/document/document.service';
import { PluginService } from '@pmod/document/plugin.service';
import { XoDataType } from '@pmod/xo/data-type.model';
import { Xo } from '@zeta/api';
import { XoDefinition } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';

import { DatatypeTabComponent, PluginTabData } from '../datatype-tab.component';


@Component({
    templateUrl: './datatype-plugin-tab.component.html',
    styleUrls: ['./datatype-plugin-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTypePluginTabComponent extends DatatypeTabComponent<XoDataType, PluginTabData> {

    constructor(
        protected readonly documentService: DocumentService,
        readonly pluginService: PluginService,
        protected readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(documentService, cdr, injector);
    }

    get definition(): XoDefinition {
        return this.injectedData.bundle?.definition;
    }

    get data(): Xo[] {
        return this.injectedData.bundle?.data;
    }
}

