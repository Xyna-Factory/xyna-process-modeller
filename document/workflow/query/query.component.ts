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
import { Component, ElementRef, Injector, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentMappingService } from '@pmod/document/component-mapping.service';
import { DocumentService } from '@pmod/document/document.service';
import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { I18nService } from '@zeta/i18n';

import { XcDialogService, XcIdentityDataWrapper, XcMenuItem, XcStringIntegerDataWrapper } from '@zeta/xc';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeQueryConfigurationRequest } from '../../../xo/change-query-configuration-request.model';
import { XoQuery } from '../../../xo/query.model';
import { XoTextArea } from '../../../xo/text-area.model';
import { InvocationComponent } from '../invocation/invocation.component';


@Component({
    selector: 'query',
    templateUrl: './query.component.html',
    styleUrls: ['./query.component.scss']
})
export class QueryComponent extends InvocationComponent {

    showDocumentation = false;


    limitDataWrapper = new XcStringIntegerDataWrapper(
        () => this.query.limit,
        value => this.query.limit = value
    );

    historyDataWrapper = new XcIdentityDataWrapper(
        () => this.query.queryHistory,
        value => {
            if (value !== this.query.queryHistory) {
                this.query.queryHistory = value;
                this.changedConfig();
            }
        }
    );


    constructor(
        router: Router,
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        i18n: I18nService,
        dialogs: XcDialogService,
        injector: Injector
    ) {
        super(router, elementRef, componentMappingService, documentService, detailLevelService, i18n, dialogs, injector);

        this.menuItems.unshift(
            <XcMenuItem>{ name: 'Show/Hide Configurations', translate: true,
                click: () => this.toggleCollapsed()
            }
        );
    }


    @Input()
    set query(value: XoQuery) {
        this.invocation = value;

        // show documentation area, if it contains text
        this.showDocumentation = !!this.documentationArea && !!this.documentationArea.text;
    }


    get query(): XoQuery {
        return this.invocation as XoQuery;
    }


    get documentationArea(): XoTextArea {
        return this.query.documentationArea;
    }


    changedConfig() {
        this.performAction({ type: ModellingActionType.change, objectId: this.query.id, request: XoChangeQueryConfigurationRequest.config(this.query.limit, this.query.queryHistory) });
    }


    toggleCollapsed() {
        this.detailLevelService.toggleCollapsed(this.query.filterArea.id);
        this.detailLevelService.toggleCollapsed(this.query.sortingArea.id);
        this.detailLevelService.toggleCollapsed(this.query.selectionMaskArea.id);
    }


    keydown(event: KeyboardEvent) {
        if (event.key === 'Delete') {
            event.stopPropagation();
        }
    }
}
