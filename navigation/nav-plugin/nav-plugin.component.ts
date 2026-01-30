/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2025 Xyna GmbH, Germany
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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';

import { PluginService } from '@pmod/document/plugin.service';
import { XoGuiDefiningWorkflow } from '@yggdrasil/plugin/gui-defining-workflow.model';
import { XoPlugin } from '@zeta/xc';
import { XoDefinitionBundle } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';

import { CommonNavigationComponent } from '../common-navigation-class/common-navigation-component';
import { XcModule } from '../../../../zeta/xc/xc.module';


@Component({
    selector: 'xfm-mod-nav-plugin',
    templateUrl: './nav-plugin.component.html',
    styleUrls: ['./nav-plugin.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcModule]
})
export class NavPluginComponent extends CommonNavigationComponent {

    readonly pluginService: PluginService = inject<PluginService>(PluginService);

    private _plugin: XoPlugin;
    private _bundle: XoDefinitionBundle;

    get bundle(): XoDefinitionBundle {
        return this._bundle;
    }

    @Input('plugin')
    set plugin(value: XoPlugin) {
        this._plugin = value;
        this.requestBundle();
    }

    @Input('plugin-number')
    pluginNumber: number;

    constructor() {
        const cdr = inject(ChangeDetectorRef);

        super(cdr);
    }

    private requestBundle() {
        const definingWorkflow: XoGuiDefiningWorkflow = new XoGuiDefiningWorkflow();
        definingWorkflow.runtimeContext = this._plugin.pluginRTC;
        definingWorkflow.fQN = this._plugin.definitionWorkflowFQN;
        definingWorkflow.zetaRTC = this._plugin.pluginRTC.toRuntimeContext();
        this.pluginService.getFromCacheOrCallWorkflow(definingWorkflow).subscribe({
            next: (bundle: XoDefinitionBundle) => this._bundle = bundle
        });
    }
}
