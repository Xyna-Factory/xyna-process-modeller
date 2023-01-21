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
import { Component, ElementRef, EventEmitter, HostBinding, HostListener, Injector, Input, OnDestroy, OnInit, Optional, Output } from '@angular/core';

import { DocumentItem, DocumentModel } from '@pmod/document/model/document.model';
import { MessageBusService } from '@yggdrasil/events';
import { XcMenuItem } from '@zeta/xc';

import { Observable, Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Vector2 } from 'three';

import { ModellingActionType } from '../../../api/xmom.service';
import { WorkflowDetailSettingsService } from '../../../workflow-detail-settings.service';
import { XoDeleteRequest } from '../../../xo/delete-request.model';
import { XoItem } from '../../../xo/item.model';
import { XoReferableObject } from '../../../xo/referable-object.model';
import { XoRequest } from '../../../xo/request.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { WorkflowDetailLevelService } from '../../workflow-detail-level.service';


export interface TriggeredAction {
    type: ModellingActionType;
    objectId: string;
    request: XoRequest;
    subsequentAction?: this;
    errorHandler?: (err: any) => void;
}



/**
 * Base class for all components, modelling-actions can be done on
 */
@Component({
    template: ''
})
export class ModellingObjectComponent implements OnInit, OnDestroy {

    private readonly destroySubject = new Subject<void>();

    /**
     * Collapsed state of this modelling object (concerns both, item (e. g. variable) and area)
     */
    @HostBinding('class.collapsed')
    private _collapsed = false;

    @HostBinding('class.locked')
    private _locked = false;

    private _model: XoReferableObject;
    private _menuItems: XcMenuItem[] = [];
    protected readonly detailSettings: WorkflowDetailSettingsService;
    protected readonly messageBus: MessageBusService;
    private _documentModel: DocumentModel<DocumentItem>;
    private lockedSubscription: Subscription;

    @Output()
    readonly triggerAction = new EventEmitter<TriggeredAction>();


    constructor(
        protected readonly elementRef: ElementRef,
        protected readonly componentMappingService: ComponentMappingService,
        protected readonly documentService: DocumentService,
        protected readonly detailLevelService: WorkflowDetailLevelService,
        @Optional() injector: Injector  // TODO: delete other injected services and get all via injector
    ) {
        this.detailSettings = injector.get(WorkflowDetailSettingsService);
        this.messageBus = injector.get(MessageBusService);

        this.menuItems.push(
            <XcMenuItem>{
                name: 'Remove',
                icon: 'delete',
                translate: true,
                click: () => this.remove(),
                visible: () => this.allowRemove() && !this.readonly
            }
        );
        this._collapsed = this.isDefaultCollapsed();
    }


    ngOnInit() {
        this.untilDestroyed(this.detailLevelService.collapsedChange()).pipe(
            filter(id => this.getCollapseId() === id)
        ).subscribe(id => {
            this.setCollapsed(this.detailLevelService.isCollapsed(id));
        });

        this.untilDestroyed(this.detailLevelService.collapsedAll()).subscribe(() => {
            this.setCollapsed(true);
        });
    }


    ngOnDestroy() {
        if (this.getModel() && this.allowRegisterAtComponentMapping()) {
            this.componentMappingService.removeComponentForObject(this.getModel());
        }
        this.lockedSubscription?.unsubscribe();
        this.destroySubject.next();
    }


    protected untilDestroyed<T>(observable: Observable<T>): Observable<T> {
        return observable?.pipe(takeUntil(this.destroySubject));
    }


    /** Decides whether this component is read-only */
    protected isReadonly(): boolean {
        return this.getModel()?.readonly || this.isLocked();
    }


    /** Decides whether this component is locked due to the document state */
    protected isLocked(): boolean {
        return this._locked;
    }


    /** Decides whether this component can be removed */
    protected allowRemove(): boolean {
        return false;
    }


    protected allowRemoveWithDeleteKey(): boolean {
        return true;
    }


    protected absorbDeleteKey(): boolean {
        return true;
    }


    protected lockedChanged() {
    }


    @Input()
    set documentModel(value: DocumentModel<DocumentItem>) {
        if (this.documentModel !== value) {
            this._documentModel = value;
            this.lockedSubscription?.unsubscribe();
            this.lockedSubscription = value?.lockedChange.subscribe(locked => {
                this._locked = locked;
                this.lockedChanged();
            });
        }
        this.afterDocumentModelSet();
    }


    get documentModel(): DocumentModel<DocumentItem> {
        return this._documentModel;
    }


    protected afterDocumentModelSet() {
    }


    @HostBinding('class.readonly')
    get readonly(): boolean {
        return this.isReadonly();
    }


    /**
     * Externally set menu-items override internally set menu-items
     */
    @Input()
    set menuItems(items: XcMenuItem[]) {
        this._menuItems = items;
    }


    get menuItems(): XcMenuItem[] {
        return this._menuItems;
    }


    get showMenu(): boolean {
        return !!this.menuItems && this.menuItems.some(
            menuItem => !menuItem.visible || menuItem.visible(menuItem)
        );
    }


    performAction(action: TriggeredAction) {
        this.triggerAction.emit(action);
    }


    getElementRef(): ElementRef {
        return this.elementRef;
    }


    inletPosition(): Vector2 {
        let position: Vector2;
        if (this.isElementVisible()) {
            position = ModellingObjectComponent.getGlobalPosition(this.elementRef.nativeElement);
            position.x += this.elementRef.nativeElement.clientWidth / 2;
        }
        return position;
    }


    outletPosition(): Vector2 {
        if (this.isElementVisible()) {
            return this.inletPosition().add(new Vector2(0, this.elementRef.nativeElement.clientHeight - 1));
        }
        return null;
    }


    /** Returns true if the corresponding element is visible in DOM */
    isElementVisible(): boolean {
        return this.elementRef.nativeElement.offsetWidth  ||
               this.elementRef.nativeElement.offsetHeight ||
               this.elementRef.nativeElement.getClientRects().length;
    }


    getModel(): XoReferableObject {
        return this._model;
    }


    setModel(value: XoReferableObject) {
        // remove former mapping
        if (this.getModel() && this.allowRegisterAtComponentMapping()) {
            this.componentMappingService.removeComponentForObject(this.getModel());
        }

        this._model = value;

        /** @todo fixme: Assuming that created component is created for currently opened document. That is not necessarily the case (e. g. potentially for coming multi-user-updates).
         * Potential fix: Each xo has a reference to its root-xo (Workflow, DataType, ServiceGroup)
         */

        // register component at mapping service
        if (this.allowRegisterAtComponentMapping()) {
            this.componentMappingService.addComponentForItem(this, value);
        }

        // use already stored collapsed state for this model or store initial one
        const savedCollapsedState = this.detailLevelService.isCollapsed(this.getCollapseId());
        if (savedCollapsedState !== undefined) {
            this.setCollapsed(savedCollapsedState);
        } else {
            this.detailLevelService.setCollapsed(this.getCollapseId(), this.isCollapsed());
        }
    }


    @HostListener('keyup.delete', ['$event'])
    absorbKeyupDelete(event?: KeyboardEvent) {
        // FIXME Find a better way to fix PMOD-192
        event.stopPropagation();
    }


    @HostListener('keydown.delete', ['$event'])
    remove(event?: KeyboardEvent) {
        if (this.allowRemoveWithDeleteKey() && this.allowRemove() && !this.readonly) {
            this.performAction({
                type: ModellingActionType.delete,
                objectId: this.getModel().id,
                request: new XoDeleteRequest()
            });
            event?.stopPropagation();
        }
        if (this.absorbDeleteKey()) {
            event?.stopPropagation();
        }
    }


    /**
     * Decides if this component is registered at the ComponentMappingService
     */
    allowRegisterAtComponentMapping(): boolean {
        return true;
    }


    private static getGlobalPosition(element: HTMLElement): Vector2 {
        const root = document.querySelector('[dataflow-container]');
        const rootRect = root.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        return new Vector2(elementRect.left - rootRect.left, elementRect.top - rootRect.top);
    }


    //=========================================================================
    // COLLAPSED STATE
    //=========================================================================

    setCollapsed(value: boolean) {
        if (value !== this.isCollapsed() && this.isCollapsible()) {
            this._collapsed = value;
            this.detailLevelService.setCollapsed(this.getCollapseId(), value);
            this.collapsedChanged(this._collapsed);
        }
    }


    isCollapsed(): boolean {
        return this._collapsed;
    }


    isDefaultCollapsed(): boolean {
        return this.isCollapsible();
    }


    isCollapsible(): boolean {
        return true;
    }


    /**
     * ID for collapse-state (ID of model by default)
     */
    getCollapseId(): string {
        return this.getModel()?.id;
    }


    protected collapsedChanged(collapsed: boolean) {
    }


    /**
     * Returns width in pixels
     *
     * Expensive function since the value is read out of the element's style and transformed into a number
     */
    getWidth(): number {
        const widthStyle = window.getComputedStyle(this.elementRef.nativeElement, null).getPropertyValue('width');
        const width = /^(\d+(\.\d+)?)px$/.exec(widthStyle)[1];
        return parseFloat(width);
    }
}


/**
 * Base class for all components, that represent an XoItem
 */
@Component({
    template: ''
})
export class ModellingItemComponent extends ModellingObjectComponent implements OnDestroy {

    private modelChangeSubscription: Subscription;


    ngOnDestroy() {
        this.modelChangeSubscription?.unsubscribe();
    }


    get modellingItem(): XoItem {
        return this.getModel() as XoItem;
    }


    setModel(value: XoItem) {
        this.modelChangeSubscription?.unsubscribe();
        super.setModel(value);
        this.modelChangeSubscription = this.modellingItem.replaced().subscribe(() => this.modelChanged());
        this.modelChanged();
    }


    modelChanged() {
    }


    protected allowRemove(): boolean {
        return this.modellingItem.deletable;
    }
}
