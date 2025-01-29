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
import { Component, Injector } from '@angular/core';

import { XoArea } from '@pmod/xo/area.model';
import { XoDetailsItem } from '@pmod/xo/details-item.model';
import { XoMethod } from '@pmod/xo/method.model';
import { XoContainerArea } from '@pmod/xo/modelling-item.model';

import { filter } from 'rxjs/operators';

import { XoMemberVariable } from '../xo/member-variable.model';
import { DocumentComponent } from './document.component';
import { DocumentModel } from './model/document.model';


@Component({
    template: '',
    standalone: false
})
export class TypeDocumentComponent<D extends DocumentModel> extends DocumentComponent<void, D> {

    selectedVariable: XoMemberVariable;
    selectedMethod: XoMethod;
    selectedDetailsItem: XoDetailsItem;

    selectionAreaName: string;
    selectedItemName: string;
    selectedItemLabel: string;

    detailsItem: XoDetailsItem;

    constructor(injector: Injector) {
        super(injector);

        // watch for selection changes
        this.untilDestroyed(this.selectionService.selectionChange).subscribe(selectable => {
            const model = selectable?.getModel();
            if (model instanceof XoMemberVariable || model instanceof XoMethod || model instanceof XoDetailsItem) {
                this.selectItem(model);
            }
        });

        // remember name and label before sending any request to the server
        this.untilDestroyed(this.documentService.xmomService.beforeActionTriggered).pipe(filter(() => this.document.tabActive)).subscribe(() => {
            const selected = this.selectedVariable ?? this.selectedMethod ?? this.selectedDetailsItem;
            this.selectedItemName = selected?.name;
            this.selectedItemLabel = selected?.label;
        });

        // restore selection from name and label after server request
        this.untilDestroyed(this.documentService.xmomService.afterActionTriggered).pipe(filter(() => this.document.tabActive)).subscribe(() => {
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
        this.selectedVariable = item instanceof XoMemberVariable ? item : undefined;
        this.selectedMethod = item instanceof XoMethod ? item : undefined;
        this.selectedDetailsItem = item instanceof XoDetailsItem ? item : undefined;

        this.selectionAreaName = (item.parent as XoArea)?.name;
        this.selectedItemName = item.name;
        this.selectedItemLabel = item.label;
    }

    restoreSelectedItem() {
        if (this.selectedDetailsItem) {
            this.selectedDetailsItem = new XoDetailsItem(); // only to trigger refresh of datatype-details.component
            return;
        }

        this.selectedVariable = undefined;
        this.selectedMethod = undefined;
        this.selectedDetailsItem = undefined;

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
                this.selectedVariable = selectedItem;
            }
            if (selectedItem instanceof XoMethod) {
                this.selectedMethod = selectedItem;
            }
        }
    }
}
