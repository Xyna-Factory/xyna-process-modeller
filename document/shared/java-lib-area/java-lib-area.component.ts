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
import { Component, ElementRef, Injector, Input, OnDestroy, Optional } from '@angular/core';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';

import { ApiService } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcRichListItem } from '@zeta/xc';

import { Subject, Subscription } from 'rxjs';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoInsertFileRequest } from '../../../xo/insert-file-request.model';
import { XoJavaLibrariesArea } from '../../../xo/java-libraries-area.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingObjectComponent, TriggeredAction } from '../../workflow/shared/modelling-object.component';
import { JavaLibItemComponent, JavaLibItemData } from './java-lib-item.component';


@Component({
    selector: 'java-lib-area',
    templateUrl: './java-lib-area.component.html',
    styleUrls: ['./java-lib-area.component.scss']
})
export class JavaLibAreaComponent extends ModellingObjectComponent implements OnDestroy {

    get javaLibArea(): XoJavaLibrariesArea {
        return this.getModel() as XoJavaLibrariesArea;
    }

    @Input()
    set javaLibArea(value: XoJavaLibrariesArea) {
        this.setModel(value);
        this.setRichListItems();
    }

    javaLibraryRichListItems: XcRichListItem<JavaLibItemData>[] = [];

    deleteItemSubject = new Subject<TriggeredAction>();
    deleteItemSubjectSubscription: Subscription;


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        private readonly i18nService: I18nService,
        private readonly apiService: ApiService,
        detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        this.deleteItemSubjectSubscription = this.deleteItemSubject.subscribe(action => {
            // console.log('java library delete action', action);
            this.performAction(action);
        });
    }


    ngOnDestroy() {
        super.ngOnDestroy();
        if (this.deleteItemSubjectSubscription) {
            this.deleteItemSubjectSubscription.unsubscribe();
        }
    }


    setRichListItems() {
        this.javaLibraryRichListItems.splice(0, this.javaLibraryRichListItems.length);

        if (this.javaLibArea && this.javaLibArea.javaLibraries) {
            this.javaLibArea.javaLibraries.forEach(lib => {
                const data: XcRichListItem<JavaLibItemData> = {
                    component: JavaLibItemComponent,
                    data: {
                        item: lib,
                        deleteItemSubject: this.deleteItemSubject,
                        i18nService: this.i18nService,
                        getComponentEditableState: () => !this.readonly
                    }
                };
                this.javaLibraryRichListItems.push(data);
            });
        }
    }


    addLibrary() {
        const timeout = 1000 * 60 * 5;
        this.apiService.browse(timeout).subscribe(
            f => this.apiService.upload(f).subscribe(mfid =>
                this.performAction({
                    type: ModellingActionType.insert,
                    objectId: this.javaLibArea.id,
                    request: new XoInsertFileRequest(undefined, mfid.iD, 'lib')
                })
            ),
            () => console.warn('File Dialog Timeout reached. Please reopen File Dialog if you wish to upload a file.')
        );
    }
}
