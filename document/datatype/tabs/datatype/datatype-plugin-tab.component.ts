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

import { XoDataType } from '@pmod/xo/data-type.model';
import { DefinitionStackItemComponentData, XcDefinitionStackItemComponent } from '@zeta/xc/xc-form/definitions/xc-definition-stack/xc-definition-stack-item/xc-definition-stack-item.component';
import { XcStackDataSource } from '@zeta/xc/xc-stack/xc-stack-data-source';
import { XcStackItem } from '@zeta/xc/xc-stack/xc-stack-item/xc-stack-item';
import { XcComponentTemplate } from '@zeta/xc/xc-template/xc-template';

import { XcModule } from '../../../../../../zeta/xc/xc.module';
import { DatatypeTabComponent, PluginTabData } from '../datatype-tab.component';


@Component({
    templateUrl: './datatype-plugin-tab.component.html',
    styleUrls: ['./datatype-plugin-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcModule]
})
export class DataTypePluginTabComponent extends DatatypeTabComponent<XoDataType, PluginTabData> {
    readonly stackDataSource = new XcStackDataSource();

    constructor() {
        super();

        const item = new XcStackItem();
        item.setTemplate(new XcComponentTemplate(
            XcDefinitionStackItemComponent,
            <DefinitionStackItemComponentData>{ stackItem: item, definition: this.injectedData.bundle.definition, data: this.injectedData.bundle.data }
        ));
        this.stackDataSource.add(item);
    }

}

