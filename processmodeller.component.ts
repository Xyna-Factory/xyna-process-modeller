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
import { ChangeDetectorRef, Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { ApiService, FullQualifiedName, RuntimeContextSelectionSettings } from '@zeta/api';
import { KeyboardEventType, KeyDistributionService, OutsideListenerService } from '@zeta/base';
import { I18nService, LocaleService } from '@zeta/i18n';
import { RouteComponent, RuntimeContextSelectionComponent } from '@zeta/nav';
import { QueryParameterService } from '@zeta/nav/query-parameter.service';
import { XcDialogService, XcTabBarComponent, XcTabBarItem } from '@zeta/xc';

import { Subject, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { XmomObjectType } from './api/xmom-types';
import { DataTypeComponent } from './document/datatype.component';
import { DocumentService } from './document/document.service';
import { ExceptionTypeComponent } from './document/exceptiontype.component';
import { DataTypeDocumentModel } from './document/model/data-type-document.model';
import { DocumentItem, DocumentModel } from './document/model/document.model';
import { ExceptionTypeDocumentModel } from './document/model/exception-type-document.model';
import { ServiceGroupDocumentModel } from './document/model/service-group-document.model';
import { WorkflowDocumentModel } from './document/model/workflow-document.model';
import { ServiceGroupComponent } from './document/servicegroup.component';
import { WorkflowDocumentComponent } from './document/workflow-document.component';
import { PMOD_DE } from './locale/pmod.DE';
import { PMOD_EN } from './locale/pmod.EN';
import './monaco-environment';
import { ShowXmlModalComponent, ShowXmlModalData } from './navigation/details/show-xml-modal/show-xml-modal.component';
import { ErrorService } from './navigation/shared/error.service';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { XoRuntimeContext } from './xo/runtime-context.model';
import { XoWorkflow } from './xo/workflow.model';
import { I18nModule } from '../../zeta/i18n/i18n.module';
import { XcModule } from '../../zeta/xc/xc.module';
import { NavigationComponent } from './navigation/navigation.component';
import { NgClass } from '@angular/common';


@Component({
    templateUrl: './processmodeller.component.html',
    styleUrls: ['./processmodeller.component.scss'],
    providers: [I18nService],
    imports: [ToolbarComponent, I18nModule, XcModule, NavigationComponent, NgClass]
})
export class ProcessmodellerComponent extends RouteComponent implements OnInit, OnDestroy {

    private runtimeContextChangeSubscription: Subscription;

    @ViewChild(ToolbarComponent, { static: false })
    toolBar: ToolbarComponent;

    private urlProcessed = false;

    private _tabBar: XcTabBarComponent;
    private readonly _tabBarInitialized = new Subject();

    private openedDefaultWorkflow = false;

    get document(): DocumentModel {
        return this.documentService.selectedDocument;
    }

    get item(): DocumentItem {
        return this.document ? this.document.item : null;
    }

    @ViewChild(XcTabBarComponent, { static: false })
    set tabBar(value: XcTabBarComponent) {
        this._tabBar = value;
        this._tabBarInitialized.next(null);
        this._tabBarInitialized.complete();
    }

    get tabBar(): XcTabBarComponent {
        return this._tabBar;
    }


    constructor(
        public documentService: DocumentService,
        private readonly cdr: ChangeDetectorRef,
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService,
        readonly injector: Injector,
        private readonly i18nService: I18nService,
        private readonly queryParamService: QueryParameterService,
        private readonly outsideListenerService: OutsideListenerService,
        private readonly keyService: KeyDistributionService,
        private readonly errorService: ErrorService
    ) {
        super();

        this.i18nService.contextDismantlingSearch = true;
        this.i18nService.setTranslations(LocaleService.DE_DE, PMOD_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, PMOD_EN);

        this.documentService.documentListChange.subscribe(documents => {
            const updateDocuments = () => {
                const openNewDocuments = () => {
                    documents.forEach(document => {
                        // open document, if not already opened in a tab
                        if (!this.tabBar.items.find(item => item.data === document)) {
                            this.tabBar.open(this.newTabBarItem(document)).subscribe();
                        }
                    });
                };
                // get default workflow
                const defaultWorkflow = documents.find(document => document.item instanceof XoWorkflow && document.item.defaultWorkflow);
                // check, if default workflow should be closed
                if (defaultWorkflow && !defaultWorkflow.item.modified && !defaultWorkflow.item.saved && documents.length > 1) {
                    // close it and open new documents afterwards
                    this.tabBar.close(defaultWorkflow.tabBarItem).subscribe(() => openNewDocuments());
                } else {
                    // just open new documents
                    openNewDocuments();
                }
                // close tabs whose documents have been already closed
                const closeDocumentList = this.tabBar?.items.filter(item =>
                    !documents.find(document => document === item.data)
                ) ?? [];
                closeDocumentList.forEach(document => this.tabBar.close(document).subscribe());
            };
            if (this.tabBar) {
                updateDocuments();
            } else {
                this._tabBarInitialized.pipe(first()).subscribe(() => updateDocuments());
            }
        });

        this.documentService.selectionChange.subscribe(document => {
            if (this.tabBar) {
                this.tabBar.selection = this.tabBar.items.find(item => item.data === document);
                this.transformUrl();
            }
        });
    }


    ngOnInit() {
        super.ngOnInit();

        this.documentService.documentChange.subscribe(() => this.transformUrl());

        this.keyService.keyEvents
            .subscribe(eventObject => {
                if (this.document) {
                    const key = eventObject.key.toLowerCase();
                    if ((key === 'z') && eventObject.ctrl && !eventObject.shift) {
                        if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                            eventObject.preventDefault();
                        } else {
                            eventObject.execute(
                                () => this.documentService.undo().subscribe(() => this.cdr.detectChanges())
                            );
                        }
                    }
                    if ((key === 'y') && eventObject.ctrl || (key === 'z') && eventObject.ctrl && eventObject.shift) {
                        if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                            eventObject.preventDefault();
                        } else {
                            eventObject.execute(
                                () => this.documentService.redo().subscribe(() => this.cdr.detectChanges())
                            );
                        }
                    }
                    if ((key === 's') && eventObject.ctrl && eventObject.shift) {
                        if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                            eventObject.preventDefault();
                        } else {
                            eventObject.execute(
                                () => this.documentService.saveDocumentGeneric(this.document).subscribe(() => this.cdr.detectChanges())
                            );
                        }
                    }
                    if ((key === 'q') && eventObject.ctrl && eventObject.shift) {
                        if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                            eventObject.preventDefault();
                        } else {
                            eventObject.execute(() => {
                                this.tabBar.close(this.document.tabBarItem).subscribe();
                            });
                        }
                    }
                    if (key === 'f2') {
                        if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                            eventObject.preventDefault();
                        } else {
                            eventObject.execute(() => {
                                console.log('f2');
                            });
                        }
                    }
                    if (key === 'arrowright' && eventObject.ctrl && eventObject.alt) {
                        if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                            eventObject.preventDefault();
                        } else {
                            eventObject.execute(() => {
                                this.errorService.switchToNextError();
                            });
                        }
                    }
                    if (key === 'arrowleft' && eventObject.ctrl && eventObject.alt) {
                        if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                            eventObject.preventDefault();
                        } else {
                            eventObject.execute(() => {
                                this.errorService.switchToPreviousError();
                            });
                        }
                    }
                    if ((key === 'd') && eventObject.ctrl && eventObject.shift) {
                        if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                            eventObject.preventDefault();
                        } else {
                            eventObject.execute(
                                () => this.documentService.deployDocumentGeneric(this.document).subscribe(() => this.cdr.detectChanges())
                            );
                        }
                    }
                    if ((key === 'x') && eventObject.ctrl && eventObject.shift) {
                        if (eventObject.type === KeyboardEventType.KEY_TYPE_DOWN) {
                            eventObject.preventDefault();
                        } else {
                            eventObject.execute(
                                () => this.documentService.xmomService.getXML(this.document.item).subscribe(xmlResponse => {
                                    const data: ShowXmlModalData = {
                                        current: xmlResponse.current,
                                        deployed: xmlResponse.deploy,
                                        saved: xmlResponse.saved,
                                        label: this.item.label
                                    };
                                    this.dialogService.custom<void, ShowXmlModalData>(ShowXmlModalComponent, data);
                                })
                            );
                        }
                    }
                }
            });
    }


    ngOnDestroy() {
        this.outsideListenerService.removeAllOutsideListenerFromElement(<HTMLElement><unknown>window);
    }


    onShow() {
        // handle runtime context changes
        this.runtimeContextChangeSubscription = this.apiService.runtimeContextChange.subscribe(rtc => {
            this.documentService.xmomService.runtimeContext = rtc;
            // open new workflow by default
            if (rtc && !this.openedDefaultWorkflow) {
                this.documentService.openDefaultWorkflow();
                this.openedDefaultWorkflow = true;
            }
        });

        // open document(s) from URL
        this.urlProcessed = true;
        const describers = this.queryParamService.getParamsStartWith('tab')
            .map(tab => JSON.parse(decodeURI(tab.value)) as { rtc: string; fqn: string; type: XmomObjectType })
            .map(tab => ({
                rtc: XoRuntimeContext.fromQueryParam(tab.rtc).runtimeContext(),
                fqn: FullQualifiedName.decode(tab.fqn),
                type: tab.type
            }));

        // open runtime context selection dialog, if no runtime context is set (preselect RTC from first tab in URL parameter)
        if (!this.apiService.runtimeContext) {
            this.dialogService.custom(
                RuntimeContextSelectionComponent,
                <RuntimeContextSelectionSettings>{
                    setRuntimeContext: true,
                    showWorkspaces: true,
                    showApplications: false,
                    preselectedRuntimeContext: describers[0]?.rtc
                }
            ).afterDismiss().subscribe(() =>
                describers.forEach(
                    describer => this.documentService.loadDocument(
                        describer.rtc,
                        describer.fqn,
                        describer.type
                    )
                )
            );
        } else {
            describers.forEach(
                describer => this.documentService.loadDocument(
                    describer.rtc,
                    describer.fqn,
                    describer.type
                )
            );
        }
        if (this.documentService.selectedDocument) {
            this.documentService.selectedDocument.tabActive = true;
        }
    }


    onHide() {
        if (this.documentService.selectedDocument) {
            this.documentService.selectedDocument.tabActive = false;
        }
        this.runtimeContextChangeSubscription?.unsubscribe();
    }


    private newTabBarItem(document: DocumentModel): XcTabBarItem<DocumentModel> {
        let item: XcTabBarItem<DocumentModel>;

        switch (true) {
            case document instanceof WorkflowDocumentModel: {
                item = {
                    name: document.name,
                    icon: 'tb-workflow',
                    iconStyle: 'modeller',
                    component: WorkflowDocumentComponent,
                    closable: true,
                    closeTooltip: this.i18nService.translate('pmod.toolbar.close-tooltip'),
                    data: document
                };
            } break;

            case document instanceof DataTypeDocumentModel: {
                item = {
                    name: document.name,
                    icon: 'tb-datatype',
                    iconStyle: 'modeller',
                    component: DataTypeComponent,
                    closable: true,
                    closeTooltip: this.i18nService.translate('pmod.toolbar.close-tooltip'),
                    data: document
                };
            } break;

            case document instanceof ExceptionTypeDocumentModel: {
                item = {
                    name: document.name,
                    icon: 'tb-exception',
                    iconStyle: 'modeller',
                    component: ExceptionTypeComponent,
                    closable: true,
                    closeTooltip: this.i18nService.translate('pmod.toolbar.close-tooltip'),
                    data: document
                };
            } break;

            case document instanceof ServiceGroupDocumentModel: {
                item = {
                    name: document.name,
                    icon: 'tb-workflow',
                    iconStyle: 'modeller',
                    component: ServiceGroupComponent,
                    closable: true,
                    closeTooltip: this.i18nService.translate('pmod.toolbar.close-tooltip'),
                    data: document
                };
            } break;
        }

        document.tabBarItem = item;
        return item;
    }


    changeTab(event: XcTabBarItem<DocumentModel>) {
        this.documentService.selectedDocument = event ? event.data : null;
    }


    /**
     * Transforms the url so that it displays unique information enough to restore them.
     * Any existing query params are being destroyed in the process.
     */
    private transformUrl() {
        if (!this.urlProcessed) {
            return;
        }

        let i = 1;

        // not all tabs - only the selected document
        // const tabs = this._tabBar.items;
        const tabs: XcTabBarItem[] = [{ data: this.documentService.selectedDocument, component: null }];

        this.queryParamService.removeParamsStartWith('tab');

        tabs.forEach(item => {
            const doc = item.data as DocumentModel;
            if (!!doc && doc.item.saved) {
                this.queryParamService.add('tab' + i++, doc.item.toQueryValue());
            }
        });
    }
}
