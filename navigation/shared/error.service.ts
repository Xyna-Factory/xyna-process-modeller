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
import { ElementRef, Injectable } from '@angular/core';

import { ComponentMappingService } from '@pmod/document/component-mapping.service';
import { DocumentService } from '@pmod/document/document.service';
import { DocumentItem, DocumentModel } from '@pmod/document/model/document.model';
import { ErrorItem } from '@pmod/xo/issue.model';
import { XoWorkflow } from '@pmod/xo/workflow.model';

import { merge } from 'rxjs';
import { filter } from 'rxjs/operators';



@Injectable()
export class ErrorService {
    // private currentErrorIndex = -1;
    tmpElementRef: ElementRef;

    static readonly CLASS_HIGHLIGHT = 'error-highlight';
    static readonly CLASS_CHECKABLE = 'error-checkable';


    get document(): DocumentModel {
        return this.documentService.selectedDocument;
    }


    get item(): DocumentItem {
        return this.document ? this.document.item : null;
    }


    constructor(
        private readonly documentService: DocumentService,
        private readonly componentMappingService: ComponentMappingService
    ) {
        merge(
            this.documentService.selectionChange,
            this.documentService.documentChange
        ).subscribe(() => {
            this.retrieveIssues();
            this.retrieveWarnings();
        });
    }


    retrieveIssues() {
        if (this.item instanceof XoWorkflow) {
            this.documentService.xmomService.getXmomIssues(this.item).pipe(filter(r => !!r)).subscribe(response =>
                this.document?.setIssues(response.issues)
            );
        }
    }


    retrieveWarnings() {
        if (this.item instanceof XoWorkflow) {
            this.documentService.xmomService.getXmomWarnings(this.item).pipe(filter(r => !!r)).subscribe(response =>
                this.document?.setWarnings(response.warnings)
            );
        }
    }


    checkErrorHandler(errorItem: ErrorItem) {
        if (errorItem.errorId) {
            this.documentService.xmomService.checkXmomWarning(this.item, errorItem.errorId).subscribe(response => {
                if (response) {
                    this.retrieveWarnings();
                }
            });
        }
    }


    switchToNextError() {
        // if (this.document?.issues?.length > 0) {
        //     this.currentErrorIndex = (this.currentErrorIndex + 1) % this.document.issues.length;
        //     this.switchToError(this.currentErrorIndex);
        // } else {
        //     this.currentErrorIndex = -1;
        // }
    }


    switchToPreviousError() {
        // if (this.document?.issues?.length > 0) {
        //     this.currentErrorIndex = this.currentErrorIndex > 0 ? this.currentErrorIndex - 1 : this.document.issues.length - 1;
        //     // this.switchToError(this.currentErrorIndex);
        // } else {
        //     this.currentErrorIndex = -1;
        // }
    }


    switchToError(error: ErrorItem) {
        if (this.item instanceof XoWorkflow && error) {
            this.tmpElementRef?.nativeElement.classList.remove(ErrorService.CLASS_HIGHLIGHT);
            this.tmpElementRef?.nativeElement.classList.remove(ErrorService.CLASS_CHECKABLE);

            const value = this.componentMappingService.getComponentForId(this.item, error.objectId);
            const elementRef: ElementRef = value?.getElementRef();
            if (elementRef) {
                elementRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                elementRef.nativeElement.classList.add(ErrorService.CLASS_HIGHLIGHT);
                if (error.checkable) {
                    elementRef.nativeElement.classList.add(ErrorService.CLASS_CHECKABLE);
                }

                setTimeout(() => {
                    elementRef.nativeElement.classList.remove(ErrorService.CLASS_HIGHLIGHT);
                    elementRef.nativeElement.classList.remove(ErrorService.CLASS_CHECKABLE);
                }, 3000);
            }
            this.tmpElementRef = elementRef;
        }
    }
}
