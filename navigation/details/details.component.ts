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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';

import { FM_RTC } from '@fman/const';
import { DEPLOYMENT_ITEMS_ISWP } from '@fman/deployment-items/restorable-deployment-items.component';
import { XoDeploymentItemId } from '@fman/deployment-items/xo/xo-deployment-item-id.model';
import { XoDeploymentItem } from '@fman/deployment-items/xo/xo-deployment-item.model';
import { XmomService } from '@pmod/api/xmom.service';
import { XoGetXmomRelationsResponse } from '@pmod/xo/get-xmom-relations-response.model';
import { ApiService, FullQualifiedName, XoApplication as XoApplicationZeta, XoRuntimeContext, XoWorkspace as XoWorkspaceZeta } from '@zeta/api';
import { AuthService } from '@zeta/auth';
import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { merge } from 'rxjs/';
import { filter, finalize, switchMapTo } from 'rxjs/operators';

import { DocumentService } from '../../document/document.service';
import { DocumentItem, DocumentModel } from '../../document/model/document.model';
import { TypeDocumentModel } from '../../document/model/type-document.model';
import { XoApplication, XoWorkspace } from '../../xo/runtime-context.model';
import { CommonNavigationComponent } from '../common-navigation-class/common-navigation-component';
import { ShowXmlModalComponent, ShowXmlModalData } from './show-xml-modal/show-xml-modal.component';


@Component({
    selector: 'xfm-mod-nav-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailsComponent extends CommonNavigationComponent {
    private _deploymentItem: XoDeploymentItem;
    pendingDeploymentItem = false;

    relations: XoGetXmomRelationsResponse;
    hasRelations = false;


    constructor(
        private readonly i18n: I18nService,
        private readonly apiService: ApiService,
        private readonly authService: AuthService,
        private readonly dialogService: XcDialogService,
        private readonly documentService: DocumentService,
        private readonly xmomService: XmomService,
        cdr: ChangeDetectorRef
    ) {
        super(cdr);

        merge(
            this.documentService.selectionChange,
            this.xmomService.itemDeployed,
            this.xmomService.itemSaved
        ).pipe(this.whileActive).subscribe(() => {
            if (this.document) {
                this.getDeploymentItem();
                this.getRelations();
            }
        });
    }

    onShow() {
        super.onShow();
        if (this.documentService.selectedDocument) {
            this.getDeploymentItem();
            this.getRelations();
        }
    }

    get username(): string {
        return this.authService.username;
    }

    get document(): DocumentModel {
        return this.documentService.selectedDocument;
    }

    get item(): DocumentItem {
        return this.document ? this.document.item : null;
    }

    get name(): string {
        return this.item ? FullQualifiedName.decode(this.item.$fqn).name : '';
    }

    get path(): string {
        return this.item && this.item.saved
            ? FullQualifiedName.decode(this.item.$fqn).path
            : this.document
                ? (this.document as TypeDocumentModel).newTypePath || ''
                : '';
    }

    get workspace(): string {
        return this.item?.$rtc instanceof XoWorkspace ? this.item.$rtc.name : '';
    }

    get applicationName(): string {
        return this.item?.$rtc instanceof XoApplication ? this.item.$rtc.name : '';
    }

    get applicationVersion(): string {
        return this.item?.$rtc instanceof XoApplication ? this.item.$rtc.version : '';
    }

    get deploymentItem(): XoDeploymentItem {
        return this._deploymentItem;
    }

    showXML() {
        this.xmomService.getXML(this.document.item).subscribe(xmlResponse => {
            const data: ShowXmlModalData = {
                current: xmlResponse.current,
                deployed: xmlResponse.deploy,
                saved: xmlResponse.saved,
                label: this.item.label
            };
            this.dialogService.custom<void, ShowXmlModalData>(ShowXmlModalComponent, data);
        });
    }

    stealLock() {
        this.dialogService.confirm(
            this.i18n.translate('pmod.nav.details.steal-lock'),
            this.i18n.translate('pmod.nav.details.steal-lock-confirm')
        ).afterDismissResult().pipe(
            filter(result => result),
            switchMapTo(this.xmomService.unlockXmomObject(this.item))
        ).subscribe(() => {
            this.documentService.refreshXmomItem(this.item);
            this.getDeploymentItem();
        });
    }

    getDeploymentItem() {
        this._deploymentItem = null;
        if (this.item && this.active) {
            this.pendingDeploymentItem = true;
            // Build deployment id
            const id = new XoDeploymentItemId('id');
            id.name = this.item.$fqn;
            id.type = this.item.type;

            // Extract rtc
            let rtc: XoRuntimeContext;
            switch (this.item.$rtc.constructor) {
                case XoWorkspace:
                    rtc = XoWorkspaceZeta.fromName((this.item.$rtc as XoWorkspace).name);
                    break;
                case XoApplication:
                    rtc = XoApplicationZeta.fromName((this.item.$rtc as XoApplication).name, (this.item.$rtc as XoApplication).version);
                    break;
            }

            // Get deployment state
            this.apiService
                .startOrder(FM_RTC, DEPLOYMENT_ITEMS_ISWP.Details, [id, rtc], XoDeploymentItem).pipe(
                    finalize(() => {
                        this.pendingDeploymentItem = false;
                        this.updateView();
                    })
                ).subscribe(result => {
                    if (result.output && !result.errorMessage) {
                        this._deploymentItem = result.output[0] as XoDeploymentItem;
                        this.updateView();
                    }
                });
        }
    }

    getRelations() {
        this.hasRelations = false;
        this.relations = null;
        if (this.item && this.active) {
            this.xmomService.getXmomRelations(this.documentService.selectedDocument.item).subscribe(response => {
                if (response) {
                    this.relations = response;
                    response.properties.forEach((classInterface, key) => {
                        if (response[key] && response[key].length > 0) {
                            this.hasRelations = true;
                        }
                    });
                    this.updateView();
                }
            });
        }
    }

    // copyText(event: MouseEvent) {
    //     const textarea = document.createElement('textarea');
    //     const div = document.createElement('div');
    //     const value = (event.target as HTMLDivElement) ? (event.target as HTMLDivElement).textContent : '';

    //     div.appendChild(textarea);
    //     textarea.value = value;
    //     document.body.appendChild(textarea);
    //     textarea.select();
    //     document.execCommand('Copy');
    //     document.body.removeChild(textarea);
    // }

    // get browserAllowsCopy(): boolean {
    //     return document.queryCommandSupported('Copy');
    // }
}
