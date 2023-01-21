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
import { Injectable, OnDestroy } from '@angular/core';

import { FQNRTC, MessageBusService, XMOMLocated, XoDocumentChange, XoDocumentLock, XoDocumentUnlock } from '@yggdrasil/events';
import { FullQualifiedName, RuntimeContext } from '@zeta/api';
import { AuthService } from '@zeta/auth';
import { dispatchMouseClick, isString } from '@zeta/base';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcStatusBarEntryType, XcStatusBarService } from '@zeta/xc';

import { BehaviorSubject, merge, Observable, of, Subject, Subscription, throwError } from 'rxjs';
import { catchError, filter, finalize, map, mapTo, share, switchMap, switchMapTo, tap } from 'rxjs/operators';

import { DeploymentState, XmomObjectType } from '../api/xmom-types';
import { ModellingAction, ModellingActionType, XmomService } from '../api/xmom.service';
import { PMOD_DE } from '../locale/pmod.DE';
import { PMOD_EN } from '../locale/pmod.EN';
import { LabelPathDialogComponent, LabelPathDialogData, LabelPathDialogResult } from '../misc/modal/label-path-dialog/label-path-dialog.component';
import { FactoryService } from '../navigation/factory.service';
import { XoDataType } from '../xo/data-type.model';
import { XoDeleteRequest } from '../xo/delete-request.model';
import { XoError } from '../xo/error.model';
import { XoExceptionType } from '../xo/exception-type.model';
import { XoGetDataTypeResponse } from '../xo/get-data-type-response.model';
import { XoGetExceptionTypeResponse } from '../xo/get-exception-type-response.model';
import { XoGetServiceGroupResponse } from '../xo/get-service-group-response.model';
import { XoGetWorkflowResponse } from '../xo/get-workflow-response.model';
import { XoGetXmomItemResponse } from '../xo/get-xmom-item-response.model';
import { XoItem } from '../xo/item.model';
import { XoRefactorRequest } from '../xo/refactor-request.model';
import { XoRepairsRequiredError } from '../xo/repairs-required-error.model';
import { XoServiceGroup } from '../xo/service-group.model';
import { XoUpdateXmomItemResponse } from '../xo/update-xmom-item-response.model';
import { XoWorkflow } from '../xo/workflow.model';
import { XoXmomItemResponse } from '../xo/xmom-item-response.model';
import { XoXmomItem } from '../xo/xmom-item.model';
import { ErrorDialogComponent, ErrorDialogData } from './modal/error-dialog/error-dialog.component';
import { RepairDialogComponent, RepairDialogData } from './modal/repair-dialog/repair-dialog.component';
import { DataTypeDocumentModel } from './model/data-type-document.model';
import { DocumentItem, DocumentModel } from './model/document.model';
import { ExceptionTypeDocumentModel } from './model/exception-type-document.model';
import { ServiceGroupDocumentModel } from './model/service-group-document.model';
import { TypeDocumentModel } from './model/type-document.model';
import { WorkflowDocumentModel } from './model/workflow-document.model';


export enum DocumentState {
    closed,
    unsaved,
    unknown
}

export interface CloseResult {
    state: DocumentState;
    unknownError?: string;   // optional error message in case of unknown document state
}


@Injectable()
export class DocumentService implements OnDestroy {

    private readonly documentListSubject = new BehaviorSubject<DocumentModel[]>([]);
    private readonly documentUpdateSubject = new Subject<{item: DocumentItem; response: XoUpdateXmomItemResponse}>();
    private readonly selectedDocumentSubject = new BehaviorSubject<DocumentModel>(null);
    private readonly closeDocumentSubject = new Subject<DocumentModel>();

    private readonly pendingModellingActionSubject = new BehaviorSubject<boolean>(false);
    private readonly documentDownloadedSubject = new Subject<void>();

    /** A list of the last five most recently used paths */
    recentlyUsedPaths: string[] = [];

    /**
     * document-key > list of waiting events for this document
     * if event could not be handled by any document, a matching document might be opened afterwards - so the event gets cached
     * (e. g. if responding a large document takes longer than sending its corresponding events)
     */
    private readonly cachedLocks = new Map<string, (XoDocumentLock | XoDocumentUnlock)[]>();
    private readonly cachedChanges = new Map<string, XoDocumentChange>();

    private readonly subscriptions: Subscription[] = [];


    constructor(
        authService: AuthService,
        private readonly i18n: I18nService,
        private readonly dialogService: XcDialogService,
        private readonly statusBarService: XcStatusBarService,
        private readonly factoryService: FactoryService,
        readonly xmomService: XmomService,
        readonly messageBus: MessageBusService
    ) {
        this.i18n.setTranslations(I18nService.DE_DE, PMOD_DE);
        this.i18n.setTranslations(I18nService.EN_US, PMOD_EN);

        // clear documents on login
        authService.didLogin.subscribe(() => this.documentListSubject.next([]));

        this.xmomService.runtimeContextChange.subscribe(rtc => {
            // client-side lock of all documents which are not part of this RTC
            this.documents.forEach(document => document.updateLock({
                userLock: document.lockInfo.userLock,
                rtcLock: !rtc.equals(document.item.$rtc.runtimeContext()),
                readonly: document.lockInfo.readonly
            }));
        });

        const documentByEvent = (event: XMOMLocated): DocumentModel<DocumentItem> =>
            this.documents.find(document =>
                document.item.$fqn === event.$fqn &&
                document.item.$rtc.runtimeContext().equals(event.$rtc.toRuntimeContext())
            );

        // subscribe to message bus' document events
        this.subscriptions.push(
            merge(
                messageBus.documentLock,
                messageBus.documentUnlock
            ).subscribe(lockEvent => {
                const document = documentByEvent(lockEvent);
                if (document) {
                    this.handleLock(document, lockEvent);
                } else {
                    // cache event
                    const key = lockEvent.uniqueDocumentKey;
                    const documentList = this.cachedLocks.get(key) ?? [];
                    documentList.push(lockEvent);
                    this.cachedLocks.set(key, documentList);
                }
            }),
            messageBus.documentChange.pipe(
                filter(event => event.creator !== authService.username)
            ).subscribe(changeEvent => {
                // console.log('Opened Documents: ' + this.documents.map(d => d.item.$fqn).join(',') + ' :: Change Event: ' +  changeEvent.$fqn);
                // get document with matching fqn and rtc
                const document = documentByEvent(changeEvent);
                // if document was found,
                if (document) {
                    // refresh document, if isn't currently being saved as a new document (in that case, the change event was for the old document)
                    if (!document.savingAs) {
                        this.refreshXmomItem(document.item);
                    }
                } else {
                    // otherwise cache event
                    this.cachedChanges.set(changeEvent.uniqueDocumentKey, changeEvent);
                }
            }),
            messageBus.xmomDelete.pipe(
                // document is open and delete was invoked by self
                filter(event => event.creator === authService.username)
            ).subscribe(event => {
                const document = documentByEvent(event);
                this.closeDocument(document, true).subscribe();
            })
        );
    }


    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }


    private handleLock(document: DocumentModel<DocumentItem>, event: XoDocumentLock | XoDocumentUnlock) {
        document?.updateLock({
            userLock: event instanceof XoDocumentLock ? event.creator : undefined,
            rtcLock: document.lockInfo.rtcLock,
            readonly: document.lockInfo.readonly
        });
    }


    private get documents(): DocumentModel[] {
        return this.documentListSubject.value;
    }


    // TODO replace by uniform handling of XoError-type (PMOD-563)
    private showError(message: string, error: any) {
        const objects = error.error && error.error.error && error.error.error.objects && error.error.error.objects.length > 0 ? error.error.error.objects : null;
        const errorCode: string = error.error && isString(error.error.errorCode) ? error.error.errorCode : null;
        const exceptionMessage: string = error.error && isString(error.error.exceptionMessage) ? error.error.exceptionMessage : null;
        const errorMessage: string = errorCode && this.i18n.hasTranslation(errorCode)
            ? this.i18n.translate(errorCode)
            : error && error.error && isString(error.error.message)
                ? error.error.message
                : (exceptionMessage || null);
        const stackTrace = objects && objects[0] && objects[0].value ? objects[0].value : '';
        // this.dialogService.custom(ErrorDialogComponent, <ErrorDialogData>{
        //     errorMessage: message + (exceptionMessage ? ': ' + exceptionMessage : ''),
        //     stackTrace: stackTrace
        // });
        this.dialogService.custom(ErrorDialogComponent, <ErrorDialogData>{
            errorMessage: message + (errorMessage ? ': ' + errorMessage : ''),
            stackTrace: stackTrace
        }, null, 'allow-linebreak');
    }


    showErrorDialog(error: XoError) {
        this.dialogService.custom(
            ErrorDialogComponent,
            <ErrorDialogData>{
                errorMessage: this.i18n.translate('This action did not work') + (error.message ? '\n"' + error.message + '"' : ''),
                stackTrace: error.stacktrace
            },
            undefined,
            'allow-linebreak'
        );
    }


    get documentListChange(): Observable<DocumentModel[]> {
        return this.documentListSubject.asObservable();
    }


    /**
     * Observable triggered when a document's template is downloaded
     */
    get documentDownloaded(): Observable<void> {
        return this.documentDownloadedSubject.asObservable();
    }


    /**
     * Observable triggered when a document is updated
     */
    get documentChange(): Observable<{item: DocumentItem; response: XoUpdateXmomItemResponse}> {
        return this.documentUpdateSubject.asObservable();
    }


    get documentClose(): Observable<DocumentModel> {
        return this.closeDocumentSubject.pipe(share());
    }


    get selectedDocument(): DocumentModel {
        return this.selectedDocumentSubject.value;
    }


    set selectedDocument(value: DocumentModel) {
        if (value !== this.selectedDocument) {
            this.selectedDocumentSubject.next(value);
        }
    }


    get selectionChange(): Observable<DocumentModel> {
        return this.selectedDocumentSubject.pipe(share());
    }


    get isSelectedDocumentSaving(): boolean {
        return !!this.selectedDocument && this.selectedDocument.saving;
    }


    get isSelectedDocumentDeploying(): boolean {
        return !!this.selectedDocument && this.selectedDocument.deploying;
    }


    get isSelectedDocumentDownloading(): boolean {
        return this.selectedDocument instanceof TypeDocumentModel && this.selectedDocument.downloading;
    }


    addDocument(documentModel: DocumentModel) {
        if (documentModel) {
            // check if there are events waiting for this document
            const documentKey = FQNRTC.uniqueKey(documentModel.item.$fqn, documentModel.item.$rtc.runtimeContext());
            const documentLocks = this.cachedLocks.get(documentKey);
            documentLocks?.forEach(event => {
                this.handleLock(documentModel, event);
            });
            this.cachedLocks.delete(documentKey);
            const documentChange = this.cachedChanges.get(documentKey);
            if (documentChange) {
                this.refreshXmomItem(documentModel.item);
            }
            this.cachedChanges.delete(documentKey);

            documentModel.updateLock({
                userLock: documentModel.lockInfo.userLock,
                rtcLock: documentModel.lockInfo.rtcLock,
                readonly: documentModel.item.readonly
            });

            this.documents.push(documentModel);
            this.documentListSubject.next(this.documents);
        }
    }


    /**
     * Removes document from internal document stack
     * @param documentModel Document to remove
     */
    private removeDocument(documentModel: DocumentModel) {
        const index = this.documents.indexOf(documentModel);
        if (index >= 0) {
            this.documents.splice(index, 1);

            const newSelectedIndex = index < this.documents.length ? index : this.documents.length - 1;
            this.selectedDocument = (newSelectedIndex >= 0) ? this.documents[newSelectedIndex] : null;

            this.documentListSubject.next(this.documents);
        }
    }


    closeDocument(documentModel: DocumentModel, force = false): Observable<CloseResult> {
        const result = <CloseResult>{ state: DocumentState.closed };
        // cancel, if document is marked as pending right now
        const item = documentModel.item;
        const revision = documentModel.revision;
        if (this.xmomService.isPendingXmomObject(item.toRtc(), item.toFqn(), item.type)) {
            return of(result);
        }
        // close xmom object
        return this.xmomService.closeXmomObject(item, revision, force).pipe(
            catchError(err => {
                // skip, if document has been closed by force
                if (!force) {
                    // status 409 means, that the document could not be closed
                    if (err && err.status === 409) {
                        result.state = DocumentState.unsaved;
                    } else {
                        const exceptionMessage = err && err.error && isString(err.error.exceptionMessage) ? err.error.exceptionMessage : '';
                        // TODO: refactor, once PMOD-525 is developed
                        if (exceptionMessage.indexOf('is not open') < 0) {
                            result.state = DocumentState.unknown;
                            result.unknownError = exceptionMessage || err.message;
                        }
                    }
                }
                return of(result);
            }),
            mapTo(result),
            tap(closeResult => {
                if (closeResult.state === DocumentState.closed) {
                    this.removeDocument(documentModel);
                    this.closeDocumentSubject.next(documentModel); // TODO: call before removeDocument?
                }
            })
        );
    }


    deleteItem(xmomItem: XoXmomItem, force = false) {
        const errorHandler = (err: any) => {
            // delete failed with invalid xml?
            if (!force && (<XoError>err.error)?.errorCode === 'XYNA-01437') {
                const title = this.i18n.translate('Delete and Undeploy');
                const msg = this.i18n.translate('The XMOM Item %0 could not be parsed. Do you want to delete it anyway?', { key: '%0', value: xmomItem.$fqn });
                // ask, whether to delete with force
                this.dialogService.confirm(title, msg)
                    .afterDismissResult(true)
                    .subscribe(() => this.deleteItem(xmomItem, true));
                return;
            }
            this.showError(this.i18n.translate('Could not delete document'), err);
        };

        const rtc = xmomItem.rtc ?? this.xmomService.runtimeContext;
        const data: ModellingAction = {
            type: ModellingActionType.delete,
            request: new XoDeleteRequest(undefined, force),
            objectId: null,
            errorHandler,
            xmomItem,
            rtc
        };
        // remark: closing the document before deletion is not necessary, since server handles it
        this.performModellingAction(data, undefined).subscribe();
    }


    refactorItem(xmomItem: XoXmomItem): Observable<void> {
        const rtc = xmomItem.rtc ?? this.xmomService.runtimeContext;
        const data: LabelPathDialogData = {
            header: this.i18n.translate(LabelPathDialogComponent.HEADER_MOVE_RENAME, {key: '$0', value: FullQualifiedName.decode(xmomItem.$fqn).path + '.' + xmomItem.label}),
            confirm: this.i18n.translate(LabelPathDialogComponent.CONFIRM_MOVE_RENAME),
            force: this.i18n.translate(LabelPathDialogComponent.FORCE_MOVE_RENAME),
            forceTooltip: this.i18n.translate(LabelPathDialogComponent.FORCE_MOVE_RENAME_TOOLTIP),
            presetLabel: xmomItem.label,
            presetPath: FullQualifiedName.decode(xmomItem.$fqn).path,
            pathsObservable: this.getPaths()
        };
        // open dialog to select label and path first
        return this.dialogService.custom(LabelPathDialogComponent, data).afterDismissResult().pipe(
            filter(result => !!result),
            switchMap(result => this.performModellingAction({
                type: ModellingActionType.refactor,
                request: XoRefactorRequest.refactorWith(result.path, result.label, result.force),
                objectId: null,
                xmomItem,
                rtc
            }))
        );
    }


    /**
     * Performs a modelling action on the specified object
     * @param action Modelling action to perform
     * @param item XMOM Item to update with response
     */
    performModellingAction(action: ModellingAction, item?: DocumentItem): Observable<void> {
        /** @todo Use configured RuntimeContext */
        this.pendingModellingActionSubject.next(true);
        return this.xmomService.performModellingAction(action).pipe(
            map(updateResponse => {
                // update document with response
                if (item && updateResponse.updates) {
                    this.handleXmomItemUpdate(item, updateResponse, updateResponse.updates.data);
                }
                // perform subsequent action
                if (action.subsequentAction) {
                    action.subsequentAction.request.revision = updateResponse.revision;
                    this.performModellingAction(action.subsequentAction, item).subscribe();
                } else {
                    this.pendingModellingActionSubject.next(false);
                }
            }),
            catchError(err => {
                this.pendingModellingActionSubject.next(false);
                if (action.errorHandler) {
                    // call custom error handler
                    action.errorHandler(err);
                } else {
                    // show generic error dialog
                    this.showErrorDialog(err.error as XoError);
                    // refresh item with backend state
                    if (item) {
                        this.refreshXmomItem(item);
                    }
                }
                return throwError(err);
            })
        );
    }


    private handleDocumentUpdate(documentModel: DocumentModel, updateResponse: XoUpdateXmomItemResponse, action: 'saved' | 'deployed') {
        this.handleXmomItemUpdate(documentModel.item, updateResponse, updateResponse.updates.data);
        // clear any locks, since the document can't be locked after a save-as and can't be saved or deployed when locked
        documentModel.updateLock(DocumentModel.UNLOCKED);
        // show status bar message
        this.statusBarService.display(
            documentModel.item.$fqn + ' ' + this.i18n.translate('pmod.' + action),
            XcStatusBarEntryType.SUCCESS
        );
    }


    private handleXmomItemUpdate(item: DocumentItem, response: XoXmomItemResponse, updates: XoItem[]) {
        if (updates.length > 0) {
            item.update(updates);
        }
        this.handleXmomItemResponse(item, response);
        this.documentUpdateSubject.next({ item, response: response as XoUpdateXmomItemResponse });
    }


    private handleXmomItemResponse(item: DocumentItem, response: XoXmomItemResponse) {
        item.deploymentState = <DeploymentState>response.deploymentState;
        item.revision = response.revision;
        item.modified = response.modified;
        item.saved = response.saveState;
    }


    /**
     * Discards all local changes and overwrites item with the backend state
     * @param item XMOM Instance to be refreshed with the backend state
     */
    refreshXmomItem(item: DocumentItem) {
        this.xmomService.loadXmomObject(item.toRtc(), item.toFqn(), item.type).subscribe(
            response => {
                // handle item update
                this.handleXmomItemUpdate(item, response, [response.xmomItem]);
                // update tab bar label due to changes of the document
                const document = this.getOpenDocument(item.toRtc(), item.toFqn());
                document?.updateTabBarLabel();
            },
            error => this.showError(this.i18n.translate('This XMOM Item could not be refreshed.'), error)
        );
    }


    get pendingModellingActionChange(): Observable<boolean> {
        return this.pendingModellingActionSubject.asObservable();
    }


    get pendingModellingAction(): boolean {
        return this.pendingModellingActionSubject.getValue();
    }


    /**
     * Returns the open document model that matches the given xmom object
     * @returns Open document model or undefined, if the document model has not been opened yet
     */
    private getOpenDocument(rtc: RuntimeContext, fqn: FullQualifiedName): DocumentModel {
        return this.documents.find(document => {
            const documentFqn = document.item.toFqn();
            const documentRtc = document.item.toRtc();
            return documentFqn.equals(fqn, false) && documentRtc.equals(rtc);
        });
    }


    private loadXmomObject(rtc: RuntimeContext, fqn: FullQualifiedName, type: XmomObjectType, repair = false): Observable<XoGetXmomItemResponse> {
        // cancel, if document is marked as pending right now
        if (this.xmomService.isPendingXmomObject(rtc, fqn, type)) {
            return of(null);
        }
        // cancel, if document is already open
        const document = this.getOpenDocument(rtc, fqn);
        if (document) {
            // select document
            this.selectedDocument = document;
            return of(null);
        }
        // load xmom object
        return this.xmomService.loadXmomObject(rtc, fqn, type, repair).pipe(
            catchError(err => {
                // status 409 means, that the document has to be repaired first
                if (err.error && err.status === 409) {
                    // show errors and ask, whether the document should be repaired
                    return this.dialogService.custom(
                        RepairDialogComponent,
                        <RepairDialogData>{
                            repairEntries: new XoRepairsRequiredError().decode(err.error).repairs,
                            preRepair: true
                        }
                    ).afterDismissResult().pipe(
                        // cancel, if document was not chosen to be repaired
                        filter(result => result),
                        // load xmom object with enforced repair option set
                        switchMapTo(this.xmomService.loadXmomObject(rtc, fqn, type, true))
                    );
                }
                return throwError(err);
            })
        );
    }


    undo(): Observable<XoGetXmomItemResponse> {
        // ensure, that the selected document has been created in / loaded from the selected workspace
        if (this.selectedDocument && this.xmomService.runtimeContext.equals(this.selectedDocument.originRuntimeContext)) {
            const item = this.selectedDocument.item;
            return this.xmomService.undo(item).pipe(
                tap(response => {
                    this.handleXmomItemUpdate(item, response, [response.xmomItem]);
                    this.selectedDocument.updateTabBarLabel();
                }, error => {
                    if (error && (error as { status: number }).status !== 404) {
                        this.showError(this.i18n.translate('Could not undo last action'), error);
                    }
                })
            );
        }
        return of(null);
    }


    redo(): Observable<XoGetXmomItemResponse> {
        // ensure, that the selected document has been created in / loaded from the selected workspace
        if (this.selectedDocument && this.xmomService.runtimeContext.equals(this.selectedDocument.originRuntimeContext)) {
            const item = this.selectedDocument.item;
            return this.xmomService.redo(item).pipe(
                tap(response => {
                    this.handleXmomItemUpdate(item, response, [response.xmomItem]);
                    this.selectedDocument.updateTabBarLabel();
                }, error => {
                    if (error && (error as { status: number }).status !== 404) {
                        this.showError(this.i18n.translate('Could not redo previous action'), error);
                    }
                })
            );
        }
        return of(null);
    }


    loadDocument(rtc: RuntimeContext, fqn: FullQualifiedName, type: XmomObjectType, errorMessage?: string) {
        this.loadXmomObject(rtc, fqn, type).pipe(filter(response => !!response)).subscribe(
            getItemResponse => {
                const item = <DocumentItem>getItemResponse.xmomItem;
                const originRuntimeContext = this.factoryService.runtimeContext ?? item.toRtc();
                this.handleXmomItemResponse(item, getItemResponse);

                switch (item.type) {
                    case XmomObjectType.Workflow: this.addDocument(new WorkflowDocumentModel(item as XoWorkflow, originRuntimeContext, getItemResponse.focusId)); break;
                    case XmomObjectType.DataType: this.addDocument(new DataTypeDocumentModel(item as XoDataType, originRuntimeContext, getItemResponse.focusId)); break;
                    case XmomObjectType.ExceptionType: this.addDocument(new ExceptionTypeDocumentModel(item as XoExceptionType, originRuntimeContext, getItemResponse.focusId)); break;
                    case XmomObjectType.ServiceGroup: this.addDocument(new ServiceGroupDocumentModel(item as XoServiceGroup, originRuntimeContext, getItemResponse.focusId)); break;
                    default: console.error(item.type + ' ' + this.i18n.translate('could not be identified as a document type'));
                }
            },
            error => this.showError(this.i18n.translate(errorMessage ?? 'This XmomItem could not be loaded.'), error)
        );
    }


    // ================================================================================================================
    // WORKFLOW
    // ================================================================================================================


    newWorkflow(label?: string, defaultWorkflow = false) {
        this.xmomService.newXmomObject(
            this.xmomService.runtimeContext,
            XmomObjectType.Workflow,
            XoGetWorkflowResponse,
            label || 'New Workflow'
        ).subscribe(
            (workflowResponse: XoGetWorkflowResponse) => {
                const workflow = workflowResponse.workflow;
                workflow.defaultWorkflow = defaultWorkflow;
                this.handleXmomItemResponse(workflow, workflowResponse);
                this.addDocument(new WorkflowDocumentModel(workflow, this.xmomService.runtimeContext, workflowResponse.focusId));
            },
            error => this.showError(this.i18n.translate('A new Workflow could not be created.'), error)
        );
    }


    loadWorkflow(rtc: RuntimeContext, fqn: FullQualifiedName) {
        this.loadDocument(rtc, fqn, XmomObjectType.Workflow, 'This Workflow could not be loaded.');
    }


    openDefaultWorkflow() {
        this.newWorkflow(undefined, true);
    }


    // ================================================================================================================
    // Data Type
    // ================================================================================================================


    newDataType(label?: string) {
        this.xmomService.newXmomObject(
            this.xmomService.runtimeContext,
            XmomObjectType.DataType,
            XoGetDataTypeResponse,
            label || 'New Data Type'
        ).subscribe(
            (dataTypeResponse: XoGetDataTypeResponse) => {
                const dataType = dataTypeResponse.dataType;
                this.handleXmomItemResponse(dataType, dataTypeResponse);
                this.addDocument(new DataTypeDocumentModel(dataType, this.xmomService.runtimeContext, dataTypeResponse.focusId));
            },
            error => this.showError(this.i18n.translate('A new Data Type could not be created.'), error)
        );
    }


    loadDataType(rtc: RuntimeContext, fqn: FullQualifiedName) {
        this.loadDocument(rtc, fqn, XmomObjectType.DataType, 'This Data Type could not be loaded.');
    }


    // ================================================================================================================
    // Exception Type
    // ================================================================================================================


    newExceptionType(label?: string) {
        this.xmomService.newXmomObject(
            this.xmomService.runtimeContext,
            XmomObjectType.ExceptionType,
            XoGetExceptionTypeResponse,
            label || 'New Exception Type'
        ).subscribe(
            (exceptionTypeResponse: XoGetExceptionTypeResponse) => {
                const exceptionType = exceptionTypeResponse.exceptionType;
                this.handleXmomItemResponse(exceptionType, exceptionTypeResponse);
                this.addDocument(new ExceptionTypeDocumentModel(exceptionType, this.xmomService.runtimeContext, exceptionTypeResponse.focusId));
            },
            error => this.showError(this.i18n.translate('A new Exception Type could not be created.'), error)
        );
    }


    loadExceptionType(rtc: RuntimeContext, fqn: FullQualifiedName) {
        this.loadDocument(rtc, fqn, XmomObjectType.ExceptionType, 'This Exception Type could not be loaded.');
    }


    // ================================================================================================================
    // SERVICE GROUP
    // ================================================================================================================


    newServiceGroup(label?: string) {
        this.xmomService.newXmomObject(
            this.xmomService.runtimeContext,
            XmomObjectType.ServiceGroup,
            XoGetServiceGroupResponse,
            label || 'New Service Group'
        ).subscribe(
            (response: XoGetServiceGroupResponse) => {
                const serviceGroup = response.serviceGroup;
                this.handleXmomItemResponse(serviceGroup, response);
                this.addDocument(new ServiceGroupDocumentModel(serviceGroup, this.xmomService.runtimeContext, response.focusId));
            },
            error => this.showError(this.i18n.translate('A new Service Group could not be created.'), error)
        );
    }


    loadServiceGroup(rtc: RuntimeContext, fqn: FullQualifiedName) {
        this.loadDocument(rtc, fqn, XmomObjectType.ServiceGroup, 'This Service Group could not be loaded.');
    }


    // ================================================================================================================
    // PATHS
    // ================================================================================================================


    /**
     * get the paths of the specific runtime contexts and returns them as a flattened tree
     * in the form of a string array
     * @param rtc
     */
    getPaths(rtc?: RuntimeContext): Observable<string[]> {
        // TODO: rewrite without subject. use pipe.
        const subj = new Subject<string[]>();
        rtc = rtc || this.xmomService.runtimeContext;
        this.xmomService.listXmomPaths(rtc, undefined, 'flat').subscribe(
            xmomPaths => {
                const pathArr: string[] = [];
                xmomPaths.forEach(obj => {
                    if (obj.isAbsolute) {
                        pathArr.push(obj.path);
                    } else {
                        obj.children.forEach(child => pathArr.push(child.path));
                    }
                });
                subj.next(pathArr);
            },
            error => subj.error(error),
            () => subj.complete()
        );
        return subj.asObservable();
    }


    // ================================================================================================================
    // SAVE
    // ================================================================================================================


    saveDocumentGeneric(documentModel: DocumentModel): Observable<XoUpdateXmomItemResponse> {
        // call save for type documents that already have a new type path set
        if (documentModel instanceof TypeDocumentModel && documentModel.newTypePath) {
            return this.saveDocument(documentModel, documentModel.name, documentModel.newTypePath);
        }
        // call save-as for documents that have never been saved
        return documentModel.item.saved
            ? this.saveDocument(documentModel, undefined, undefined, false, true)
            : this.saveDocumentAs(documentModel);
    }


    saveDocumentAs(documentModel: DocumentModel, label?: string, path?: string): Observable<XoUpdateXmomItemResponse> {
        // set new type path for type documents
        if (documentModel instanceof TypeDocumentModel && !path) {
            path = documentModel.newTypePath;
        }
        // create dialog data
        const header = documentModel instanceof TypeDocumentModel
            ? this.i18n.translate(LabelPathDialogComponent.HEADER_DEPLOY_TYPE_AS)
            : this.i18n.translate(LabelPathDialogComponent.HEADER_SAVE_WORKFLOW_AS);
        const confirm = documentModel instanceof TypeDocumentModel
            ? this.i18n.translate(LabelPathDialogComponent.CONFIRM_DEPLOY)
            : this.i18n.translate(LabelPathDialogComponent.CONFIRM_SAVE);
        const data: LabelPathDialogData = {
            header,
            confirm,
            presetLabel: label || documentModel.name,
            presetPath: path || FullQualifiedName.decode(documentModel.item.$fqn).path,
            pathsObservable: this.getPaths(),
            recentlyUsedPaths: this.recentlyUsedPaths
        };
        // save document under new label and path
        return this.dialogService.custom(LabelPathDialogComponent, data).afterDismissResult().pipe(
            filter(result => !!result),
            tap(result => this.saveRecentlyUsedPaths(result)),
            switchMap(result => this.saveDocument(documentModel, result.label, result.path))
        );
    }


    saveDocument(documentModel: DocumentModel, label?: string, path?: string, force = false, forceEmptyLabelAndPath = false): Observable<XoUpdateXmomItemResponse> {
        return (documentModel.warnings?.length > 0 && !force
            ? this.errorConfirmation(this.i18n.translate('pmod.errors-confirmation.warnings'))
            : of(true)
        ).pipe(
            filter(save => save),
            tap(() => {
                documentModel.saving = true;
                if (path && label) {
                    // save-as was used
                    const documentPath = documentModel.item.toFqn().path;
                    const documentLabel = documentModel.item.label;
                    if (documentPath !== path || documentLabel !== label) {
                        // actual save-as with different fqn was used
                        documentModel.savingAs = true;
                    }
                }
            }),
            switchMap(() =>
                this.xmomService.saveXmomObject(
                    documentModel.item,
                    documentModel.revision,
                    label,
                    path,
                    force,
                    forceEmptyLabelAndPath
                ).pipe(
                    finalize(() => {
                        documentModel.saving = false;
                        documentModel.savingAs = false;
                    }),
                    catchError(err => {
                        // document already exists
                        if (err && err.status === 409) {
                            const title = this.i18n.translate('Confirm');
                            const message = this.i18n.translate('The document "%0" already exists. Would you like to overwrite it?', { key: '%0', value: path + '.' + label });
                            return this.dialogService.confirm(title, message).afterDismissResult().pipe(
                                filter(result => !!result),
                                switchMap(() => this.saveDocument(documentModel, label, path, true))
                            );
                        }
                        // unknown error occured
                        this.showError(this.i18n.translate('The document could not be saved.'), err);
                        return throwError(err);
                    }),
                    tap(updateResponse => this.handleDocumentUpdate(documentModel, updateResponse, 'saved'))
                )
            )
        );
    }


    private saveRecentlyUsedPaths(result: LabelPathDialogResult) {
        const existingPathIndex = this.recentlyUsedPaths.indexOf(result.path);
        if (existingPathIndex >= 0) {
            this.recentlyUsedPaths.splice(existingPathIndex, 1);
        }
        this.recentlyUsedPaths.unshift(result.path);
        this.recentlyUsedPaths = this.recentlyUsedPaths.slice(0, 5);
    }



    // ================================================================================================================
    // DEPLOY
    // ================================================================================================================


    deployDocumentGeneric(documentModel: DocumentModel): Observable<XoUpdateXmomItemResponse> {
        // document must be saved before deployment
        if (documentModel.item.modified || !documentModel.item.saved) {
            const title = this.i18n.translate('Warning');
            const message = documentModel.item.modified
                ? this.i18n.translate('The currently opened document has been changed. Save it now?')
                : this.i18n.translate('The currently opened document has not been saved before. Save it now?');
            // confirm saving
            return this.dialogService.confirm(title, message).afterDismissResult().pipe(
                filter(result => result),
                switchMap(() => this.saveDocumentGeneric(documentModel)),
                switchMap(() => this.deployDocumentGeneric(documentModel))
            );
        }
        // deploy right away
        return this.deployDocument(documentModel);
    }


    deployDocumentAs(documentModel: DocumentModel): Observable<XoUpdateXmomItemResponse> {
        return of(undefined).pipe(
            switchMap(() => this.saveDocumentAs(documentModel)),
            switchMap(() => this.deployDocument(documentModel))
        );
    }


    deployDocument(documentModel: DocumentModel): Observable<XoUpdateXmomItemResponse> {
        return (documentModel.issues?.length > 0
            ? this.errorConfirmation(this.i18n.translate('pmod.errors-confirmation.issues'))
            : of(true)
        ).pipe(
            filter(deploy => deploy),
            tap(() => documentModel.deploying = true),
            switchMap(() =>
                this.xmomService.deployXmomObject(
                    documentModel.item,
                    documentModel.revision
                ).pipe(
                    finalize(() => documentModel.deploying = false),
                    catchError(err => {
                        const xo = err.error as XoError;
                        this.dialogService.custom(ErrorDialogComponent, <ErrorDialogData>{
                            errorMessage: xo.exceptionMessage,
                            stackTrace: xo.stacktrace
                        });
                        return throwError(err);
                    }),
                    tap(updateResponse => this.handleDocumentUpdate(documentModel, updateResponse, 'deployed'))
                )
            )
        );
    }


    private errorConfirmation(errorLabel: string): Observable<boolean> {
        // TODO jvs default drag options?

        return this.dialogService.confirm(
            this.i18n.translate('pmod.errors-confirmation.header', { key: '$0', value: errorLabel }),
            this.i18n.translate('pmod.errors-confirmation.message', { key: '$0', value: errorLabel })
        ).afterDismissResult(true);
    }


    // ================================================================================================================
    // TEMPLATE
    // ================================================================================================================


    downloadTemplate(documentModel: TypeDocumentModel) {

        // TODO: - downloading the old way - not compatible with apache
        const downloadTemplate = (fqn: string, rtcKey: string) => {

            const fqnObj = FullQualifiedName.decode(fqn);
            const endpoint = `/XynaBlackEditionWebServices/io/buildServiceImplTemplate?datatype=${fqnObj.encode()}&workspace=${rtcKey}`;

            const xmlHttpRequest = new XMLHttpRequest();
            xmlHttpRequest.onreadystatechange = () => {
                if (xmlHttpRequest.readyState === XMLHttpRequest.DONE) {

                    if (xmlHttpRequest.status === 200) {

                        const arrBuffer = xmlHttpRequest.response as ArrayBuffer;
                        const blob = new Blob([arrBuffer], { type: 'application/octet-stream' });
                        const url = URL.createObjectURL(blob);
                        const a = window.document.createElement('a');

                        window.document.body.appendChild(a);
                        a.href = url;
                        a.download = fqnObj.name + '_template.zip';

                        dispatchMouseClick(a);
                        window.URL.revokeObjectURL(url);
                        window.document.body.removeChild(a);
                    } else {
                        this.dialogService.info(`Error: ${xmlHttpRequest.status}`, `Failed to load resources: the server responded with '${xmlHttpRequest.statusText}'`);
                    }

                    documentModel.downloading = false;
                    this.documentDownloadedSubject.next();
                }
            };

            xmlHttpRequest.onerror = () => {
                documentModel.downloading = false;
                this.documentDownloadedSubject.next();
                this.dialogService.error(this.i18n.translate('Error while downloading template for ') + fqnObj.encode());
            };

            xmlHttpRequest.open('GET', endpoint, true);
            xmlHttpRequest.responseType = 'arraybuffer';
            xmlHttpRequest.setRequestHeader('X-Requested-With', 'ShockwaveFlash/32.0.0.321');
            xmlHttpRequest.send();
            documentModel.downloading = true;
        };

        // TODO - downloading the new way - should be compatible w. apache and it's in the angular/zeta way
        // const downloadTemplate = (fqn: string, rtcKey: string) => {
        //     const fqnObj = FullQualifiedName.decode(fqn);
        //     const endpoint = `buildServiceImplTemplate?datatype=${fqnObj.encode()}&workspace=${rtcKey}`;
        //     this.http.get(endpoint, {responseType: 'arraybuffer'}).subscribe(<Observer<ArrayBuffer>>{
        //         next: response => {
        //             const blob = new Blob([response], {type: MimeTypes.bin});
        //             downloadFile(blob, fqnObj.name + '_template', MimeTypes.zip);
        //         },
        //         error: _ => {
        //             this.dialogService.error('Error while downloading template for ' + fqnObj.encode());
        //             setButtonBusyState(false);
        //         },
        //         complete: () => setButtonBusyState(false)
        //     });
        //     setButtonBusyState(true);
        // };

        (documentModel.item.modified
            ? this.dialogService.confirm(
                this.i18n.translate('Confirm'),
                this.i18n.translate('This service group contains unsaved changes and needs to be deployed in order to generate the Template.\nDo you want to deploy it now?')
            ).afterDismissResult().pipe(
                filter(result => result),
                switchMap(() => this.deployDocument(documentModel))
            )
            : of(undefined)
        ).subscribe(() => downloadTemplate(
            documentModel.item.$fqn,
            documentModel.item.$rtc.runtimeContext().uniqueKey
        ));
    }
}
