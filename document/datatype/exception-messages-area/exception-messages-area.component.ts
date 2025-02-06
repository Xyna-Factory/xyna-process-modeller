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
import { Component, ElementRef, Injector, Input, Optional } from '@angular/core';

import { XcAutocompleteDataWrapper, XcOptionItem, XcRichListItem } from '@zeta/xc';

import { ModellingActionType } from '../../../api/xmom.service';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoChangeExceptionMessageRequest } from '../../../xo/change-exception-message-request.model';
import { XoExceptionMessage } from '../../../xo/exception-message.model';
import { XoExceptionMessagesArea } from '../../../xo/exception-messages-area.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';
import { ExceptionMessageRichListItemComponent, ExceptionMessageRichListItemData } from '../exception-message-rich-list-item/exception-message-rich-list-item.component';
import { XoDefinitionBundle } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';
import { combineLatest } from 'rxjs';
import { PluginService } from '../../plugin.service';


export enum ExceptionMessageLanguage {
    GERMAN = 'DE',
    ENGLISH = 'EN'
}


@Component({
    selector: 'exception-messages-area',
    templateUrl: './exception-messages-area.component.html',
    styleUrls: ['./exception-messages-area.component.scss'],
    standalone: false
})
export class ExceptionMessagesAreaComponent extends ModellingObjectComponent {

    private readonly onclick: (item: XoExceptionMessage) => void;
    private readonly ondelete: (item: XoExceptionMessage) => void;

    pluginBundles: XoDefinitionBundle[];

    currentMessage: string;
    language = ExceptionMessageLanguage.GERMAN;
    readonly languageDataWrapper: XcAutocompleteDataWrapper;

    exceptionMessageRichListItems: XcRichListItem<ExceptionMessageRichListItemData>[] = [];


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        readonly pluginService: PluginService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

         
        const antiTreeShakingInstance = new XoExceptionMessage();

        this.languageDataWrapper = new XcAutocompleteDataWrapper(
            () => this.language,
            (val: ExceptionMessageLanguage) => this.language = val,
            Object.keys(ExceptionMessageLanguage).map<XcOptionItem>(key => ({name: ExceptionMessageLanguage[key], value: ExceptionMessageLanguage[key]}))
        );

        this.onclick = (item: XoExceptionMessage) => {
            this.currentMessage = item.message;
            this.language = item.language as ExceptionMessageLanguage;
            this.languageDataWrapper.update();
        };

        this.ondelete = (item: XoExceptionMessage) => this.performAction({
            type: ModellingActionType.change,
            objectId: this.exceptionMessagesArea.id,
            request: new XoChangeExceptionMessageRequest(undefined, item.language, '')
        });
    }


    private updateRichListItems() {
        this.exceptionMessageRichListItems = [];

        this.exceptionMessagesArea.items.data.forEach((item: XoExceptionMessage) => {
            this.exceptionMessageRichListItems.push({
                component: ExceptionMessageRichListItemComponent,
                data: {item, onclick: this.onclick, ondelete: this.ondelete, isReadonly: () => this.readonly}
            });

        });
    }


    @Input()
    set exceptionMessagesArea(value: XoExceptionMessagesArea) {
        this.setModel(value);
        this.updateBundles();
        this.updateRichListItems();
    }


    get exceptionMessagesArea(): XoExceptionMessagesArea {
        return this.getModel() as XoExceptionMessagesArea;
    }


    set() {
        this.performAction({
            type: ModellingActionType.change,
            objectId: this.exceptionMessagesArea.id,
            request: new XoChangeExceptionMessageRequest(undefined, this.language, this.currentMessage)
        });
    }

    private updateBundles() {
        this.pluginBundles = [];
        if (this.exceptionMessagesArea.plugin?.guiDefiningWorkflow) {
            combineLatest(
                this.exceptionMessagesArea.plugin.guiDefiningWorkflow.data.map(
                    value => this.pluginService.getFromCacheOrCallWorkflow(value)
                )
            ).subscribe(bundles => {
                bundles.forEach(bundle => bundle.data.push(this.exceptionMessagesArea.plugin.context));
                this.pluginBundles = bundles;
            });
        }
    }
}
