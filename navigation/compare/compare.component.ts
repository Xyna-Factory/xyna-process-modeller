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
import { XMOMState } from '@pmod/api/xmom.service';
import { DocumentService } from '@pmod/document/document.service';
import { DocumentItem, DocumentModel } from '@pmod/document/model/document.model';
import { WorkflowDocumentModel } from '@pmod/document/model/workflow-document.model';
import { XoConnectionArray } from '@pmod/xo/connection.model';
import { XoDiffOperation } from '@pmod/xo/diff-operation.model';
import { XoGetXmomItemResponse } from '@pmod/xo/get-xmom-item-response.model';
import { XoInsertOperation } from '@pmod/xo/insert-operation.model';
import { XoRemoveOperation } from '@pmod/xo/remove-operation.model';
import { XoReplaceOperation } from '@pmod/xo/replace-operation.model';
import { XoWorkflow } from '@pmod/xo/workflow.model';
import { FullQualifiedName } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';
import { catchError, of } from 'rxjs';

import { CommonNavigationComponent } from '../common-navigation-class/common-navigation-component';


@Component({
    selector: 'xfm-mod-nav-compare',
    templateUrl: './compare.component.html',
    styleUrls: ['./compare.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompareComponent extends CommonNavigationComponent {

    workflow: XoWorkflow;
    dataflow: XoConnectionArray;
    document: DocumentModel<XoWorkflow>;

    diffOperations: XoDiffOperation[] = [];

    constructor(cdr: ChangeDetectorRef,
        protected documentService: DocumentService,
        protected dialogs: XcDialogService,
        protected i18n: I18nService
    ) {
        super(cdr);

        // mock diff operations
        // TODO: request real data
        const insert = new XoInsertOperation();
        insert.description = '<mock>Insert Query "Fetch Form Info"';
        const replace = new XoReplaceOperation();
        replace.description = '<mock>Replace Mapping "Fill Form" by Workflow Invocations "Create Form" and "Fill Form".';
        const remove = new XoRemoveOperation();
        remove.description = '<mock>Remove Conditional Choice';
        this.diffOperations.push(insert, replace, remove);
    }


    loadDeployedWorkflow() {
        const workflowDocument = this.documentService.selectedDocument as DocumentModel<XoWorkflow>;

        if (workflowDocument) {
            const savedWorkflow = workflowDocument.item;
            this.documentService.loadXmomObject(
                savedWorkflow.$rtc.runtimeContext(),
                FullQualifiedName.decode(savedWorkflow.$fqn),
                savedWorkflow.type, false, XMOMState.DEPLOYED
            ).pipe(
                catchError(error => {
                    this.dialogs.error(this.i18n.translate('pmod.nav.compare.load-error', { key: '$0', value: savedWorkflow.$fqn }));
                    return of(new XoGetXmomItemResponse());
                })
            ).subscribe(response => {
                this.workflow = <DocumentItem>response.xmomItem as XoWorkflow;

                if (this.workflow) {
                    this.document = new WorkflowDocumentModel(this.workflow, workflowDocument.originRuntimeContext);
                    const lockInfo = {...workflowDocument.lockInfo};
                    lockInfo.readonly = true;
                    this.document.updateLock(lockInfo);

                    this.updateView();

                    // load dataflow of deployed Workflow
                    this.documentService.xmomService.getDataflow(this.workflow, XMOMState.DEPLOYED).subscribe(dataflowResponse =>
                        this.dataflow = dataflowResponse.connections
                    );
                }
            });
        }
    }
}
