/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
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
import { Injectable } from '@angular/core';
import { WorkflowDetailSettingsService } from '@pmod/workflow-detail-settings.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

/**
 * Manages detail lever per Workflow. I. e.
 * - collapsed state for each object's ID, that is collapsable in some way
 * - one flag to display the FQNs throughout the whole Workflow
 */
@Injectable()
export class WorkflowDetailLevelService {

    /**
     * holds the collapsed state for each referable object by its ID
     */
    private readonly _collapsed = new Map<string, boolean>();

    /**
     * Subject to trigger if collapsed state changes for an ID
     */
    private readonly _collapsedChange = new Subject<string>();

    private readonly _collapsedAll = new Subject<void>();

    private readonly _showFQN: BehaviorSubject<boolean>;


    constructor(private readonly workflowSettings: WorkflowDetailSettingsService) {
        this._showFQN = new BehaviorSubject<boolean>(workflowSettings.showFQN);
    }


    // -- COLLAPSED ---------------------------------------------

    /**
     * Returns collapsed state for an ID
     * @param id ID of object to request collapsed state for
     * @return Collapsed state for ID. If it is not known, its collapsed state is undefined
     */
    isCollapsed(id: string): boolean | undefined {
        return this._collapsed.get(id);
    }


    hasCollapsedState(id: string): boolean {
        return this._collapsed.get(id) !== undefined;
    }


    collapsedChange(): Observable<string> {
        return this._collapsedChange.asObservable();
    }


    setCollapsed(id: string, collapsed: boolean) {
        if (id && this._collapsed.get(id) !== collapsed) {
            this._collapsed.set(id, collapsed);
            this._collapsedChange.next(id);
        }
    }


    toggleCollapsed(id: string) {
        this.setCollapsed(id, !this.isCollapsed(id));
    }


    setAllCollapsed() {
        this._collapsedAll.next();
    }


    collapsedAll(): Observable<void> {
        return this._collapsedAll.asObservable();
    }


    // -- FQN ---------------------------------------------------

    get showFQN(): boolean {
        return this._showFQN.value;
    }


    setShowFQN(value: boolean) {
        this._showFQN.next(value);
    }


    showFQNChange(): Observable<boolean> {
        return this._showFQN.asObservable();
    }
}
