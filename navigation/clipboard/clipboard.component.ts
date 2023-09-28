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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';

import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { throwError } from 'rxjs';
import { catchError, switchMapTo } from 'rxjs/operators';

import { DocumentService } from '../../document/document.service';
import { TriggeredAction } from '../../document/workflow/shared/modelling-object.component';
import { XoError } from '../../xo/error.model';
import { XoGetClipboardResponse } from '../../xo/get-clipboard-response.model';
import { XoContainerArea } from '../../xo/modelling-item.model';
import { CommonNavigationComponent } from '../common-navigation-class/common-navigation-component';


@Component({
    selector: 'xfm-mod-nav-clipboard',
    templateUrl: './clipboard.component.html',
    styleUrls: ['./clipboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClipboardComponent extends CommonNavigationComponent {

    readonly clipboardArea = new XoContainerArea();


    constructor(
        cdr: ChangeDetectorRef,
        private readonly i18n: I18nService,
        private readonly dialogService: XcDialogService,
        private readonly documentService: DocumentService
    ) {
        super(cdr);
        this.documentService.xmomService.clipboardChange.subscribe(() => this.refreshClipboard());
        this.documentService.xmomService.invalidateClipboard();
    }


    private handleResponse(response: XoGetClipboardResponse) {
        this.clipboardArea.items
            .clear()
            .append(
                ...response.entries.data.map(entry => entry.item)
            );
        this.updateView();
    }


    performAction(action: TriggeredAction) {
        const document = this.documentService.selectedDocument;
        if (document) {
            this.documentService.xmomService.performModellingAction({
                objectId: action.objectId,
                type: action.type,
                request: action.request,
                xmomItem: document.item,
                rtc: document.item.$rtc.runtimeContext()
            }).pipe(
                catchError(err => {
                    this.documentService.showErrorDialog(err.error as XoError);
                    return throwError(err);
                })
            ).subscribe();
        }
    }


    refreshClipboard() {
        this.documentService.xmomService.getClipboard().subscribe(
            response => this.handleResponse(response)
        );
    }


    clearClipboard() {
        this.dialogService.confirm(
            this.i18n.translate('pmod.nav.clipboard.clear-confirm-title'),
            this.i18n.translate('pmod.nav.clipboard.clear-confirm-message')
        ).afterDismissResult(true).pipe(
            switchMapTo(this.documentService.xmomService.clearClipboard())
        ).subscribe(
            response => this.handleResponse(response)
        );
    }
}
