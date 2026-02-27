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
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { XoPlugin } from '@yggdrasil/plugin/plugin.model';
import { XoDefinitionBundle } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';

import { combineLatest } from 'rxjs';

import { XoArea } from '../../../xo/area.model';
import { XoMemberMethodArea } from '../../../xo/member-method-area.model';
import { XoMemberVariableArea } from '../../../xo/member-variable-area.model';
import { PluginService } from '../../plugin.service';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../zeta/i18n/i18n.module';


@Component({
    selector: 'member-area',
    templateUrl: './member-area.component.html',
    styleUrls: ['./member-area.component.scss'],
    imports: [XcModule, I18nModule]
})
export class MemberAreaComponent extends ModellingObjectComponent {

    protected readonly pluginService = inject(PluginService);

    pluginBundles: XoDefinitionBundle[];

    @Input()
    caption: string;

    @Input()
    collapsed = false;

    @Input()
    allowAdd = true;

    @Output('added')
    readonly addEmitter = new EventEmitter<void>();

    get hasContent(): boolean {
        return ((this.area as any).items) ? (this.area as any).items.length : false;
    }

    @Input()
    set area(area: XoArea) {
        this.setModel(area);
        this.updateBundles();
    }

    get area(): XoArea {
        return this.getModel() as XoArea;
    }

    private updateBundles() {
        this.pluginBundles = [];
        let plugin: XoPlugin;
        if (this.area instanceof XoMemberVariableArea || this.area instanceof XoMemberMethodArea) {
            plugin = this.area.plugin;
        }

        if (plugin?.guiDefiningWorkflow) {
            combineLatest(
                plugin.guiDefiningWorkflow.data.map(
                    value => this.pluginService.getFromCacheOrCallWorkflow(value)
                )
            ).subscribe(bundles => {
                bundles.forEach(bundle => bundle.data.push(plugin.context));
                this.pluginBundles = bundles;
            });
        }
    }
}
