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
import { Component, signal } from '@angular/core';

import { XoArea } from '@pmod/xo/area.model';
import { XoDetailsItem } from '@pmod/xo/details-item.model';
import { XoMethod } from '@pmod/xo/method.model';
import { XoContainerArea } from '@pmod/xo/modelling-item.model';

import { filter } from 'rxjs/operators';

import { ModellingActionType } from '../api/xmom.service';
import { XoMemberVariable } from '../xo/member-variable.model';
import { DocumentComponent } from './document.component';
import { DocumentModel } from './model/document.model';


@Component({ template: '' })
export class TypeDocumentComponent<D extends DocumentModel> extends DocumentComponent<void, D> {

    readonly selectedVariable = signal<XoMemberVariable>(undefined);
    readonly selectedMethod = signal<XoMethod>(undefined);
    readonly selectedDetailsItem = signal<XoDetailsItem>(undefined);

    selectionAreaName: string;
    selectedItemName: string;
    selectedItemLabel: string;
    private pendingInsertAreaId: string;
    private pendingInsertItemIds = new Set<string>();

    detailsItem: XoDetailsItem;

    constructor() {
        super();

        // watch for selection changes
        this.untilDestroyed(this.selectionService.selectionChange).subscribe(selectable => {
            const model = selectable?.getModel();
            if (model instanceof XoMemberVariable || model instanceof XoMethod || model instanceof XoDetailsItem) {
                this.selectItem(model);
            }
        });

        // remember name and label before sending any request to the server
        this.untilDestroyed(this.documentService.xmomService.beforeActionTriggered).pipe(filter(() => this.document.tabActive)).subscribe(action => {
            const selected = this.selectedVariable() ?? this.selectedMethod() ?? this.selectedDetailsItem();
            this.selectedItemName = selected?.name;
            this.selectedItemLabel = selected?.label;
            this.capturePendingInsert(action?.type, action?.objectId);
        });

        // restore selection from name and label after server request
        this.untilDestroyed(this.documentService.xmomService.afterActionTriggered).pipe(filter(() => this.document.tabActive)).subscribe(() => {
            if (this.handlePendingFocusOrInsert()) {
                return;
            }
            if (this.hasStaleSelectedItem()) {
                this.clearSelectedItem();
                this.cdr.markForCheck();
                return;
            }
            this.restoreSelectedItem();
            this.cdr.markForCheck();
        });

        // restore selection after document item got replaced on the server
        this.untilDestroyed(this.document.item.replaced()).subscribe(() => {
            this.restoreSelectedItem();
            this.cdr.detectChanges();
        });
    }


    selectItem(item: XoMemberVariable | XoMethod | XoDetailsItem) {
        this.selectedVariable.set(item instanceof XoMemberVariable ? item : undefined);
        this.selectedMethod.set(item instanceof XoMethod ? item : undefined);
        this.selectedDetailsItem.set(item instanceof XoDetailsItem ? item : undefined);

        this.selectionAreaName = (item.parent as XoArea)?.name;
        this.selectedItemName = item.name;
        this.selectedItemLabel = item.label;
        this.cdr.markForCheck();
    }

    private clearSelectedItem() {
        this.selectedVariable.set(undefined);
        this.selectedMethod.set(undefined);
        this.selectedDetailsItem.set(undefined);
        this.selectionAreaName = undefined;
        this.selectedItemName = undefined;
        this.selectedItemLabel = undefined;
    }

    private hasStaleSelectedItem(): boolean {
        const selected = this.selectedVariable() ?? this.selectedMethod() ?? this.selectedDetailsItem();
        if (!selected) {
            return false;
        }

        const selectedId = selected?.id;
        if (!selectedId) {
            return true;
        }

        const isPresent = this.document.item.areas.data.some(area => {
            if (!(area instanceof XoContainerArea)) {
                return false;
            }
            return area.items.data.some(item => item.id === selectedId);
        });

        return !isPresent;
    }

    restoreSelectedItem() {
        if (this.selectedDetailsItem()) {
            this.selectedDetailsItem.set(new XoDetailsItem()); // only to trigger refresh of datatype-details.component
            this.cdr.markForCheck();
            return;
        }

        this.clearSelectedItem();

        // returns item with specified name
        const getItemByName = (items: (XoMemberVariable | XoMethod)[], name: string) =>
            items.find(item => name === item.name);

        // returns item with specified label (if it is unique, otherwise undefined)
        const getItemByLabel = (items: (XoMemberVariable | XoMethod)[], label: string) => {
            let item: (XoMemberVariable | XoMethod);
            for (const entry of items) {
                if (entry.label === label) {
                    if (!item) {
                        item = entry;
                    } else {
                        // label is not unique
                        return;
                    }
                }
            }
            return item;
        };

        // find previously selected item in selection area
        const selectionArea = this.document.item.areas.data.find(area => area.name === this.selectionAreaName);
        if (selectionArea instanceof XoContainerArea) {
            const items = selectionArea.items.data as (XoMemberVariable | XoMethod)[];
            const selectedItem =
                getItemByName(items, this.selectedItemName) ??
                getItemByLabel(items, this.selectedItemLabel);
            if (selectedItem instanceof XoMemberVariable) {
                this.selectedVariable.set(selectedItem);
            }
            if (selectedItem instanceof XoMethod) {
                this.selectedMethod.set(selectedItem);
            }
        }
        this.cdr.markForCheck();
    }


    private capturePendingInsert(actionType: ModellingActionType, objectId: string) {
        this.pendingInsertAreaId = undefined;
        this.pendingInsertItemIds.clear();
        if (actionType !== ModellingActionType.insert || !objectId) {
            return;
        }

        const area = this.findContainerArea(objectId);
        if (area) {
            this.pendingInsertAreaId = area.id;
            area.items.data.forEach(item => this.pendingInsertItemIds.add(item.id));
        }
    }


    private handlePendingFocusOrInsert(): boolean {
        if (this.pendingFocusId) {
            const focusId = this.pendingFocusId;
            this.pendingFocusId = undefined;
            this.trySelectObjectWithRetry(focusId, 5, () => {
                if (!this.selectPendingInsertedItem()) {
                    this.restoreSelectedItem();
                    this.cdr.markForCheck();
                }
            });
            return true;
        }
        return this.selectPendingInsertedItem();
    }


    private trySelectObjectWithRetry(id: string, retries: number, fallback: () => void) {
        setTimeout(() => {
            if (this.selectObject(id)) {
                this.cdr.markForCheck();
                return;
            }
            if (retries > 0) {
                this.trySelectObjectWithRetry(id, retries - 1, fallback);
            } else {
                fallback();
            }
        }, 0);
    }


    private selectPendingInsertedItem(): boolean {
        if (!this.pendingInsertAreaId) {
            return false;
        }

        const area = this.findContainerArea(this.pendingInsertAreaId);
        this.pendingInsertAreaId = undefined;
        if (!(area instanceof XoContainerArea)) {
            this.pendingInsertItemIds.clear();
            return false;
        }

        const insertedItem = [...area.items.data].reverse().find(item => !this.pendingInsertItemIds.has(item.id));
        this.pendingInsertItemIds.clear();
        if (!(insertedItem instanceof XoMemberVariable || insertedItem instanceof XoMethod)) {
            return false;
        }

        this.selectItem(insertedItem);
        this.trySelectObjectWithRetry(insertedItem.id, 5, () => this.cdr.markForCheck());
        this.cdr.markForCheck();
        return true;
    }


    private findContainerArea(areaId: string): XoContainerArea {
        return this.document.item.areas.data.find(area => area.id === areaId) as XoContainerArea;
    }
}
