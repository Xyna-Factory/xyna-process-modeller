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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';

import { DocumentService } from '../../document/document.service';
import { of, Subscription } from 'rxjs';

import { map } from 'rxjs/operators';

import { ErrorItem, XoIssueArray } from '@pmod/xo/issue.model';
import { ErrorService } from '../shared/error.service';
import { CommonNavigationComponent } from '../common-navigation-class/common-navigation-component';
import { XoWarningArray } from '@pmod/xo/warning.model';


@Component({
    selector: 'xfm-mod-nav-errors',
    templateUrl: './errors.component.html',
    styleUrls: ['./errors.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorsComponent extends CommonNavigationComponent implements OnDestroy {
    issues: ErrorItem[] = [];
    warnings: ErrorItem[] = [];

    errors: ErrorItem[] = [];   // merged issues and warnings

    private readonly documentChangeSubscription: Subscription;
    private issuesChangeSubscription: Subscription;
    private warningsChangeSubscription: Subscription;


    constructor(
        cdr: ChangeDetectorRef,
        documentService: DocumentService,
        protected readonly errorService: ErrorService
    ) {
        super(cdr);

        this.documentChangeSubscription = documentService.selectionChange.subscribe(document => {
            this.issuesChangeSubscription?.unsubscribe();
            this.warningsChangeSubscription?.unsubscribe();
            this.issuesChangeSubscription = (document?.issuesChange ?? of(new XoIssueArray())).pipe(
                map(issues => issues?.data ?? [])
            ).subscribe(issues => {
                this.issues = issues;
                this.errors = this.issues.concat(...this.warnings);
                if (this.active) {
                    this.updateView();
                }
            });
            this.warningsChangeSubscription = (document?.warningsChange ?? of(new XoWarningArray())).pipe(
                map(warnings => warnings?.data ?? [])
            ).subscribe(warnings => {
                this.warnings = warnings;
                this.errors = this.issues.concat(...this.warnings);
                if (this.active) {
                    this.updateView();
                }
            });
        });
    }


    ngOnDestroy() {
        this.documentChangeSubscription?.unsubscribe();
        this.issuesChangeSubscription?.unsubscribe();
        this.warningsChangeSubscription?.unsubscribe();
    }


    selectedError(error: ErrorItem) {
        this.errorService.switchToError(error);
    }


    checkedError(error: ErrorItem) {
        this.errorService.checkErrorHandler(error);
    }
}
