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
import { Component, Input } from '@angular/core';

import { ModellingActionType } from '../../../../api/xmom.service';
import { XoContentArea } from '../../../../xo/content-area.model';
import { XoInsertBranchRequest } from '../../../../xo/insert-branch-request.model';
import { XoItemBarArea } from '../../../../xo/item-bar-area.model';
import { XoRequest } from '../../../../xo/request.model';
import { XoVariable } from '../../../../xo/variable.model';
import { ModellingObjectComponent } from '../../shared/modelling-object.component';
import { NgFor } from '@angular/common';
import { VariableComponent } from '../../variable/variable.component';
import { XcModule } from '../../../../../../zeta/xc/xc.module';
import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';


@Component({
    selector: 'item-bar-area',
    templateUrl: './item-bar-area.component.html',
    styleUrls: ['./item-bar-area.component.scss'],
    imports: [NgFor, VariableComponent, XcModule, I18nModule]
})
export class ItemBarAreaComponent extends ModellingObjectComponent {

    @Input()
    branchArea: XoContentArea;


    @Input()
    set itemBarArea(value: XoItemBarArea) {
        this.setModel(value);
    }

    get itemBarArea(): XoItemBarArea {
        return this.getModel() as XoItemBarArea;
    }


    addBranch(item: XoVariable) {
        if (this.branchArea && item && !this.readonly) {
            this.performAction({ type: ModellingActionType.insert, objectId: this.branchArea.id, request: new XoInsertBranchRequest('', -1, item.$fqn) });
        }
    }


    completeBranches() {
        if (this.branchArea && !this.readonly) {
            this.performAction({ type: ModellingActionType.complete, objectId: this.branchArea.id, request: new XoRequest() });
        }
    }
}
