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
import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';

import { DocumentService } from '../../../document/document.service';
import { DocumentItem, DocumentModel } from '@pmod/document/model/document.model';
import { ErrorItem } from '@pmod/xo/issue.model';

import { ErrorService } from '../error.service';


@Component({
    selector: 'xfm-mod-nav-error',
    templateUrl: './error-item.component.html',
    styleUrls: ['./error-item.component.scss']
})
export class ErrorItemComponent {
    @Input()
    error: ErrorItem;

    @Input()
    checkable: boolean;

    @Output()
    readonly errorSelectionChanged = new EventEmitter<ErrorItem>();

    @Output()
    readonly errorCheckedChanged = new EventEmitter<ErrorItem>();

    tmpElementRef: ElementRef;


    get document(): DocumentModel {
        return this.documentService.selectedDocument;
    }

    get item(): DocumentItem {
        return this.document ? this.document.item : null;
    }

    constructor(
        private readonly documentService: DocumentService,
        private readonly errorService: ErrorService
    ) { }


    clickErrorHandler(error: ErrorItem) {
        this.errorSelectionChanged.emit(error);
    }


    checkErrorHandler(error: ErrorItem) {
        this.errorCheckedChanged.emit(error);
    }
}
