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
import { ChangeDetectorRef, Component, inject, Injector, OnDestroy, OnInit, Optional } from '@angular/core';

import { RuntimeContext } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcTabComponent } from '@zeta/xc';

import { BehaviorSubject, Observable, Observer, of, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs/operators';

import { XmomObjectType } from '../api/xmom-types';
import { ModellingAction } from '../api/xmom.service';
import { ComponentMappingService } from './component-mapping.service';
import { DocumentService, DocumentState } from './document.service';
import { CloseDialogComponent, CloseDialogData } from './modal/close-dialog/close-dialog.component';
import { DocumentModel } from './model/document.model';
import { SelectionService } from './selection.service';
import { TriggeredAction } from './workflow/shared/modelling-object.component';
import { SelectableModellingObjectComponent } from './workflow/shared/selectable-modelling-object.component';


@Component({
    template: ''
})
export class DocumentComponent<R, D extends DocumentModel> extends XcTabComponent<R, D> implements OnInit, OnDestroy {

    protected readonly cdr = inject(ChangeDetectorRef);
    protected readonly i18n = inject(I18nService);
    protected readonly dialogService = inject(XcDialogService);
    protected readonly documentService = inject(DocumentService);
    protected readonly selectionService = inject(SelectionService);
    protected readonly componentMappingService = inject(ComponentMappingService);


    private readonly destroySubject = new Subject<void>();
    private dismissing = false;


    protected readonly actionQueue = new Array<TriggeredAction>();
    protected readonly isVisibleSubject: BehaviorSubject<boolean>;

    insideForeignRtc = false;


    constructor(@Optional() injector: Injector) {
        super(injector);

        const foreignRtcObserver: Observer<RuntimeContext> = {
            next: () => this.insideForeignRtc = this.documentService.selectedDocument && !this.documentService.selectedDocument.originRuntimeContext?.equals(this.documentService.xmomService.runtimeContext),
            error: () => { },
            complete: () => { }
        };

        this.isVisibleSubject = new BehaviorSubject(this.documentService.selectedDocument === this.document);

        this.untilDestroyed(this.documentService.xmomService.runtimeContextChange).subscribe(foreignRtcObserver);
        this.untilDestroyed(this.documentService.documentChange)
            .pipe(filter(data => data.item === this.document.item && !!data.response?.focusId))
            .subscribe(data => this.selectObject(data.response.focusId));
        this.untilDestroyed(this.documentService.documentClose)
            .pipe(filter(model => model === this.document))
            .subscribe(model => this.componentMappingService.removeComponentsForRoot(model.item));

        foreignRtcObserver.next(null);
    }


    ngOnInit() {
        this.untilDestroyed(this.documentService.selectionChange).pipe(
            map(selectedDocument => selectedDocument === this.document),
            distinctUntilChanged()
        ).subscribe(change => {
            this.isVisibleSubject.next(change);
            if (change) {
                this.cdr.reattach();
                this.cdr.detectChanges();
            } else {
                this.cdr.detach();
            }
        });
        if (this.document.initialFocusId) {
            this.selectObject(this.document.initialFocusId);
        }
    }


    ngOnDestroy() {
        this.destroySubject.next();
    }


    protected untilDestroyed<T>(observable: Observable<T>): Observable<T> {
        return observable.pipe(takeUntil(this.destroySubject));
    }


    protected sendNextAction() {
        const convertAction = (action: TriggeredAction): ModellingAction => {
            if (action) {
                (<ModellingAction>action).subsequentAction = convertAction(action.subsequentAction);
                (<ModellingAction>action).xmomItem = this.document.item;
                (<ModellingAction>action).rtc = this.documentService.xmomService.runtimeContext;
                return (<ModellingAction>action);
            }
        };

        if (this.actionQueue.length > 0) {
            // dequeue next action from queue
            const action = this.actionQueue.shift();
            // peform action
            this.untilDestroyed(
                this.documentService.performModellingAction(
                    convertAction(action),
                    this.document.item
                )
            ).subscribe(
                () => {
                    this.document.updateTabBarLabel();
                    this.selectionService.clearSelection();
                }
            );
        }
    }


    performModellingAction(action: TriggeredAction) {
        // append action to queue
        this.actionQueue.push(action);
        // send next action, if idle
        if (!this.documentService.pendingModellingAction) {
            this.sendNextAction();
        }
    }


    selectObject(id: string) {
        const objectToSelect = this.componentMappingService.getComponentForId(this.document.item, id);
        if (objectToSelect instanceof SelectableModellingObjectComponent) {
            this.selectionService.selectedObject = objectToSelect;
        }
    }


    beforeDismiss(): Observable<boolean> {
        // don't close a document which is already closing
        if (this.dismissing) {
            return of(false);
        }

        this.dismissing = true;
        const title = this.i18n.translate('Close');
        const dismissSubject = new Subject<boolean>();
        const isWorkflow = this.document.item.type === XmomObjectType.Workflow;     // TODO: make it better, use polymorphism

        const dismiss = (res: boolean) => {
            this.dismissing = false;
            dismissSubject.next(res);
            dismissSubject.complete();
        };

        const close = (force: boolean) => {
            this.documentService.closeDocument(this.injectedData, force).subscribe(closeResult => {
                if (closeResult.state === DocumentState.closed || closeResult.state === DocumentState.unknown) {
                    // assume that document has been closed on the server side if closed with force or if there is an unknown close-error
                    if (closeResult.state === DocumentState.unknown && !!closeResult.unknownError) {
                        this.dialogService.error(this.i18n.translate('An error occurred while closing the document') + ': ' + this.i18n.translate(closeResult.unknownError));
                    }
                    dismiss(true);
                } else {
                    let message = this.i18n.translate('The document has unsaved changes.');
                    const saveButtonLabel = this.i18n.translate(isWorkflow ? 'Save' : 'Deploy');
                    const dontSaveButtonLabel = isWorkflow ? this.i18n.translate('Don\'t Save') : this.i18n.translate('Don\'t Deploy');
                    if (isWorkflow) {
                        message += ' ' + this.i18n.translate('Do you want to save it now?');
                    } else {
                        message += ' ' + this.i18n.translate('Do you want to save and deploy it now?');
                    }
                    const data: CloseDialogData = { title, message, saveButtonLabel, dontSaveButtonLabel };

                    this.dialogService.custom(CloseDialogComponent, data).afterDismissResult().subscribe(result => {
                        if (result.useForce) {
                            close(true);
                        } else if (result.save) {
                            const action = isWorkflow
                                ? this.documentService.saveDocumentGeneric(this.document)
                                : of(undefined).pipe(
                                    switchMap(() => this.documentService.saveDocumentGeneric(this.document)),
                                    switchMap(() => this.documentService.deployDocument(this.document))
                                );

                            this.untilDestroyed(action).subscribe(() => {
                                close(false);
                                dismiss(true);
                            });
                        } else {
                            dismiss(false);
                        }
                    });
                }
            });
        };

        close(false);
        return dismissSubject.asObservable();
    }


    get document(): D {
        return this.injectedData;
    }
}
