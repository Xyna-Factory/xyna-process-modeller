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
import { XoIssueArray } from '@pmod/xo/issue.model';
import { XoWarningArray } from '@pmod/xo/warning.model';
import { RuntimeContext } from '@zeta/api';
import { XcTabBarItem } from '@zeta/xc';

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { DeploymentState } from '../../api/xmom-types';
import { XoXmomItem } from '../../xo/xmom-item.model';


export type DocumentItem = XoXmomItem & {
    deploymentState: DeploymentState;
    revision: number;
    modified: boolean;
    saved: boolean;
};


interface DocumentLockInfo {
    userLock: string;   // another user holds the lock
    rtcLock: boolean;   // document is locked due to globally mismatching RTC
    readonly: boolean;  // document model is completely readonly for some reason
}


export abstract class DocumentModel<T extends DocumentItem = DocumentItem> {

    static readonly UNLOCKED = Object.seal({userLock: undefined, rtcLock: false, readonly: false});

    private readonly lockedSubject = new BehaviorSubject<DocumentLockInfo>(DocumentModel.UNLOCKED);
    private readonly issuesSubject = new BehaviorSubject<XoIssueArray>(null);
    private readonly warningsSubject = new BehaviorSubject<XoWarningArray>(null);

    private _tabBarItem: XcTabBarItem<DocumentModel>;

    /** Set to true by document service while saving this document */
    private readonly _saving = new BehaviorSubject<boolean>(false);

    /** Set to true by document service while saving this document as another document (additionally to saving-flag) */
    private readonly _savingAs = new BehaviorSubject<boolean>(false);

    /** Set to true by document service while deploying this document */
    private readonly _deploying = new BehaviorSubject<boolean>(false);

    /** Determines whether this document's tab is active */
    tabActive = false;


    constructor(
        /** XmomItem instance of the document */
        readonly item: T,
        /** Runtime Context, this document has been created/loaded from (not necessarily that RTC, the document lives in, but a referencing one) */
        readonly originRuntimeContext: RuntimeContext,
        public initialFocusId?: string
    ) {
    }


    get tabBarItem(): XcTabBarItem<DocumentModel> {
        return this._tabBarItem;
    }


    set tabBarItem(value: XcTabBarItem<DocumentModel>) {
        if (this.tabBarItem) {
            this.tabBarItem.afterActivate = null;
            this.tabBarItem.afterDeactivate = null;
        }

        this._tabBarItem = value;
        this.updateTabBarLabel();

        if (this.tabBarItem) {
            this.tabBarItem.afterActivate   = idx => this.tabActive = true;
            this.tabBarItem.afterDeactivate = idx => this.tabActive = false;
        }
    }


    updateTabBarLabel() {
        if (this.tabBarItem && this.item) {
            this.tabBarItem.name = '';
            if (this.item.modified) {
                this.tabBarItem.name += '* ';
            }
            this.tabBarItem.name += this.item.label;
            if (this.isLocked || this.item.readonly) {
                const uniqueKey = this.item.$rtc.runtimeContext().uniqueKey;
                this.tabBarItem.name += ' 🔒 [' + uniqueKey.replace(RuntimeContext.SEPARATOR, ' ') + ']';
            }
        }
    }


    abstract get name(): string;

    abstract get revision(): number;


    // =====================================================================================
    // SAVE & DEPLOY STATES
    // =====================================================================================

    get savingChange(): Observable<boolean> {
        return this._saving.asObservable();
    }


    get saving(): boolean {
        return this._saving.value;
    }


    set saving(value: boolean) {
        this._saving.next(value);
    }


    get savingAsChange(): Observable<boolean> {
        return this._savingAs.asObservable();
    }


    get savingAs(): boolean {
        return this._savingAs.value;
    }


    set savingAs(value: boolean) {
        this._savingAs.next(value);
    }


    get deployingChange(): Observable<boolean> {
        return this._deploying.asObservable();
    }


    get deploying(): boolean {
        return this._deploying.value;
    }


    set deploying(value: boolean) {
        this._deploying.next(value);
    }


    // =====================================================================================
    // LOCK
    // =====================================================================================

    get isLocked(): boolean {
        return !!this.lockInfo.userLock || this.lockInfo.rtcLock || this.lockInfo.readonly;
    }


    get lockedChange(): Observable<boolean> {
        return this.lockedSubject.asObservable().pipe(map(() => this.isLocked));
    }


    get lockInfo(): DocumentLockInfo {
        return this.lockedSubject.value;
    }


    updateLock(lockInfo: DocumentLockInfo) {
        this.lockedSubject.next(lockInfo);
        this.updateTabBarLabel();
    }


    // =====================================================================================
    // ISSUES & WARNINGS
    // =====================================================================================

    get issuesChange(): Observable<XoIssueArray> {
        return this.issuesSubject.asObservable();
    }


    get issues(): XoIssueArray {
        return this.issuesSubject.value;
    }


    setIssues(value: XoIssueArray) {
        this.issuesSubject.next(value);
    }


    get warningsChange(): Observable<XoWarningArray> {
        return this.warningsSubject.asObservable();
    }


    get warnings(): XoWarningArray {
        return this.warningsSubject.value;
    }


    setWarnings(value: XoWarningArray) {
        this.warningsSubject.next(value);
    }
}
