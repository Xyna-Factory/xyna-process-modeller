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
import { Component, HostBinding, inject, Input, OnDestroy } from '@angular/core';

import { XoConditionalBranching } from '@pmod/xo/conditional-branching.model';
import { coerceBoolean } from '@zeta/base';

import { XoBranch } from '../../../../xo/branch.model';
import { SelectableModellingObjectComponent } from '../../shared/selectable-modelling-object.component';
import { BranchSelectionService } from './branch-selection.service';


@Component({
    selector: 'branch',
    templateUrl: './branch.component.html',
    styleUrls: ['./branch.component.scss'],
    standalone: false
})
export class BranchComponent extends SelectableModellingObjectComponent implements OnDestroy {

    private readonly branchSelectionService = inject(BranchSelectionService);

    private _darkMode = false;


    constructor() {
        super();

        this.untilDestroyed(this.branchSelectionService.selectionChange).subscribe(
            selectedObject => this.branchSelectionChanged(selectedObject)
        );
    }


    ngOnDestroy(): void {
        super.ngOnDestroy();

        if (this.selected) {
            this.branchSelectionService.clearSelection();
        }
    }


    select() {
        // if a branch has no case area, it is only a non-semantic container (e. g. in a parallelism) and shall not be selected
        if (this.branch && this.branch.caseArea) {
            super.select();
            this.branchSelectionService.selectedObject = this.branchSelectionService.selectedObject === this
                ? null
                : this;
        }
    }


    selectionChanged(_: SelectableModellingObjectComponent) {
        // ignore default selection
    }


    branchSelectionChanged(selectedObject: SelectableModellingObjectComponent) {
        this._selected = (selectedObject === this);
    }


    @Input()
    set branch(value: XoBranch) {
        this.setModel(value);

        // collapse content area, if in case of an audit the branch is inside a conditional branching and it is missing runtime infos
        if (this.branch.missingRuntimeInfo && this.branch.parent && this.branch.parent.parent instanceof XoConditionalBranching) {
            this.setCollapsed(true);
        }
    }


    get branch(): XoBranch {
        return this.getModel() as XoBranch;
    }


    @Input('dark-mode')
    @HostBinding('class.dark')
    set darkMode(value: boolean) {
        this._darkMode = coerceBoolean(value);
    }


    get darkMode(): boolean {
        return this._darkMode;
    }


    /**
     * Since the branch model does not have stable IDs, use the ID of its content area
     */
    getCollapseId(): string {
        return this.branch?.contentArea?.id ?? 'no_branch_collapse_id';
    }


    isCollapsible(): boolean {
        return this.branch.collapsible;
    }


    isDefaultCollapsed(): boolean {
        return false;
    }
}
