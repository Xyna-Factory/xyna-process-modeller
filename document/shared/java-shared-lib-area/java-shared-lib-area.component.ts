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
import { Component, ElementRef, Injector, Input, OnDestroy, Optional } from '@angular/core';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';

import { XcRichListItem } from '@zeta/xc';

import { Subject, Subscription } from 'rxjs';

import { XoJavaSharedLibrariesArea } from '../../../xo/java-shared-libraries-area.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingObjectComponent, TriggeredAction } from '../../workflow/shared/modelling-object.component';
import { JavaSharedLibItemComponent, JavaSharedLibItemData } from './java-shared-lib-item.component';


@Component({
    selector: 'java-shared-lib-area',
    templateUrl: './java-shared-lib-area.component.html',
    styleUrls: ['./java-shared-lib-area.component.scss']
})
export class JavaSharedLibAreaComponent extends ModellingObjectComponent implements OnDestroy {

    get javaSharedLibArea(): XoJavaSharedLibrariesArea {
        return this.getModel() as XoJavaSharedLibrariesArea;
    }

    @Input()
    set javaSharedLibArea(value: XoJavaSharedLibrariesArea) {
        this.setModel(value);
        this.setRichListItems();
    }

    javaSharedLibraryRichListItems: XcRichListItem<JavaSharedLibItemData>[] = [];

    usedChangeSubject = new Subject<TriggeredAction>();
    usedChangeSubjectSubscription: Subscription;

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
        this.usedChangeSubjectSubscription = this.usedChangeSubject.subscribe(action => {
            // console.log('java shared library used action', action);
            this.performAction(action);
        });
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        if (this.usedChangeSubjectSubscription) {
            this.usedChangeSubjectSubscription.unsubscribe();
        }
    }

    setRichListItems() {

        this.javaSharedLibraryRichListItems.splice(0, this.javaSharedLibraryRichListItems.length);

        if (this.javaSharedLibArea && this.javaSharedLibArea.javaSharedLibraries) {
            this.javaSharedLibArea.javaSharedLibraries.forEach(lib => {
                const data: XcRichListItem<JavaSharedLibItemData> = {
                    component: JavaSharedLibItemComponent,
                    data: {
                        item: lib,
                        usedChangeSubject: this.usedChangeSubject,
                        getComponentEditableState: () => !this.readonly
                    },
                    selectable: true
                };
                this.javaSharedLibraryRichListItems.push(data);
            });
        }
    }

}
