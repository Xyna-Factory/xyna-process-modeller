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
import { Component, forwardRef, HostBinding, inject, Input } from '@angular/core';

import { I18nModule } from '../../../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../../../zeta/xc/xc.module';
import { XoExceptionHandlingArea } from '../../../../xo/exception-handling-area.model';
import { WorkflowDetailLevelService } from '../../../workflow-detail-level.service';
import { ModellingObjectComponent } from '../../shared/modelling-object.component';
import { CompensationComponent } from '../compensation/compensation.component';
import { ExceptionHandlingComponent } from '../exception-handling/exception-handling.component';


@Component({
    selector: 'exception-handling-area',
    templateUrl: './exception-handling-area.component.html',
    styleUrls: ['./exception-handling-area.component.scss'],
    imports: [forwardRef(() => ExceptionHandlingComponent), forwardRef(() => CompensationComponent), XcModule, I18nModule]
})
export class ExceptionHandlingAreaComponent extends ModellingObjectComponent {

    protected readonly detailLevelService = inject(WorkflowDetailLevelService);

    @Input()
    @HostBinding('class.inline')
    inline = false;

    @HostBinding('class.empty')
    empty = true;

    private readonly childIds = [];


    @Input()
    set exceptionHandlingArea(value: XoExceptionHandlingArea) {
        this.setModel(value);
        this.childIds.push(...this.exceptionHandlingArea.exceptionHandlings?.data.map(exceptionHandling => exceptionHandling.id) ?? []);
        this.childIds.push(...this.exceptionHandlingArea.compensations?.data.map(compensation => compensation.id) ?? []);
        this.updateEmptyState();

        if (this.exceptionHandlingArea.getExceptionHandlingBranches().some(branch => branch.runtimeInfo)) {
            this.detailLevelService.setCollapsed(this.exceptionHandlingArea?.exceptionHandlings?.data[0]?.id, false);
        }
        if (this.exceptionHandlingArea.getCompensationItems().some(item => item.runtimeInfo)) {
            this.detailLevelService.setCollapsed(this.exceptionHandlingArea?.compensations?.data[0]?.id, false);
        }
    }

    get exceptionHandlingArea(): XoExceptionHandlingArea {
        return this.getModel() as XoExceptionHandlingArea;
    }


    constructor() {
        super();

        // if one child changes its collapsed state, re-evaluate empty-state
        this.untilDestroyed(this.detailLevelService.collapsedChange()).subscribe(id => {
            if (this.childIds.includes(id)) {
                this.updateEmptyState();
            }
        });
    }


    private updateEmptyState() {
        this.empty = !this.childIds.find(childId => this.detailLevelService.hasCollapsedState(childId) && !this.detailLevelService.isCollapsed(childId));
    }


    toggleExceptionArea() {
        this.detailLevelService.toggleCollapsed(this.exceptionHandlingArea?.exceptionHandlings?.data[0]?.id);
    }


    toggleCompensationArea() {
        this.detailLevelService.toggleCollapsed(this.exceptionHandlingArea?.compensations?.data[0]?.id);
    }


    isDefaultCollapsed(): boolean {
        // always show this area, because it only contains the exception and compensation area
        return false;
    }
}
