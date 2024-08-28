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
import { WorkflowDetailLevelService } from '../../workflow-detail-level.service';

import { ApiService, XoManagedFileID } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcRichListItem } from '@zeta/xc';

import { catchError, Observable, Subject, switchMap } from 'rxjs';

import { HttpMethod, ModellingActionType } from '../../../api/xmom.service';
import { XoLibrariesArea } from '../../../xo/libraries-area.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';
import { LibItemComponent, LibItemData } from './lib-item.component';


@Component({
    selector: 'lib-area',
    templateUrl: './lib-area.component.html',
    styleUrls: ['./lib-area.component.scss']
})
export class LibAreaComponent extends ModellingObjectComponent {

    get libArea(): XoLibrariesArea {
        return this.getModel() as XoLibrariesArea;
    }

    @Input()
    set libArea(value: XoLibrariesArea) {
        this.setModel(value);
        this.setRichListItems();
    }

    javaLibraryRichListItems: XcRichListItem<LibItemData>[] = [];
    deleteJavaItemSubject = new Subject<number>();
    javaExpand = true;

    pythonLibraryRichListItems: XcRichListItem<LibItemData>[] = [];
    deletePythonItemSubject = new Subject<number>();
    pythonExpand = true;

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

        this.untilDestroyed(this.deleteJavaItemSubject).subscribe(index => {
            this.performAction({
                type: ModellingActionType.javaLibrary,
                objectId: null,
                request: null,
                method: HttpMethod.DELETE,
                paramSet: { index : index.toString() }
            });
        });
        this.untilDestroyed(this.deletePythonItemSubject).subscribe(index => {
            this.performAction({
                type: ModellingActionType.pythonLibrary,
                objectId: null,
                request: null,
                method: HttpMethod.DELETE,
                paramSet: { index : index.toString() }
            });
        });
    }


    setRichListItems() {
        this.javaLibraryRichListItems.splice(0, this.javaLibraryRichListItems.length);

        if (this.libArea && this.libArea.javaLibraries) {
            this.libArea.javaLibraries.data.forEach((lib, index) => {
                const data: XcRichListItem<LibItemData> = {
                    component: LibItemComponent,
                    data: {
                        libraryName: lib.name,
                        index: index,
                        deleteItemSubject: this.deleteJavaItemSubject,
                        i18nService: this.i18nService,
                        getComponentEditableState: () => !this.readonly
                    }
                };
                this.javaLibraryRichListItems.push(data);
            });
        }

        this.pythonLibraryRichListItems.splice(0, this.pythonLibraryRichListItems.length);

        if (this.libArea && this.libArea.pythonLibraries) {
            this.libArea.pythonLibraries.data.forEach((lib, index) => {
                const data: XcRichListItem<LibItemData> = {
                    component: LibItemComponent,
                    data: {
                        libraryName: lib.name,
                        index: index,
                        deleteItemSubject: this.deletePythonItemSubject,
                        i18nService: this.i18nService,
                        getComponentEditableState: () => !this.readonly
                    }
                };
                this.pythonLibraryRichListItems.push(data);
            });
        }
    }


    addJavaLibrary() {
        this.fileBrowserObservable().subscribe(manFileId =>
            this.performAction({
                type: ModellingActionType.javaLibrary,
                objectId: null,
                request: null,
                method: HttpMethod.PUT,
                paramSet: { fileId : manFileId.iD}
            })
        );
    }

    addPythonLibrary() {
        this.fileBrowserObservable().subscribe(manFileId =>
            this.performAction({
                type: ModellingActionType.pythonLibrary,
                objectId: null,
                request: null,
                method: HttpMethod.PUT,
                paramSet: { fileId : manFileId.iD}
            })
        );
    }

    private fileBrowserObservable(): Observable<XoManagedFileID> {
        const timeout = 1000 * 60 * 5;
        return this.apiService.browse(timeout).pipe(
            catchError((err, caught) => {
                console.warn('File Dialog Timeout reached. Please reopen File Dialog if you wish to upload a file.');
                return caught;
            }),
            switchMap(f => this.apiService.upload(f))
        );
    }

    toggleJavaExpand() {
        this.javaExpand = !this.javaExpand;
    }

    togglePythonExpand() {
        this.pythonExpand = !this.pythonExpand;
    }
}
