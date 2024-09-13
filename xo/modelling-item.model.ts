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
import { XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoArea, XoAreaArray } from './area.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoItem, XoItemArray } from './item.model';
import { XoReferableObject } from './referable-object.model';
import { Draggable } from '@pmod/document/workflow/shared/drag-and-drop/mod-drag-and-drop.service';


interface Containing {
    items: XoItemArray;
    update(item: XoItem): boolean;
}


@XoObjectClass(XoItem, 'xmcp.processmodeller.datatypes', 'ModellingItem')
export class XoModellingItem extends XoItem implements Draggable {

    static readonly INPUT_AREA_NAME = 'input';
    static readonly OUTPUT_AREA_NAME = 'output';
    static readonly CONTENT_AREA_NAME = 'content';
    static readonly LABEL_AREA_NAME = 'label';
    static readonly DOCUMENTATION_AREA_NAME = 'documentation';
    static readonly IMPLEMENTATION_AREA_NAME = 'implementation';
    static readonly TYPE_INFO_AREA = 'typeInfo';
    static readonly CONDITION_AREA_NAME = 'condition';
    static readonly META_TAG_AREA_NAME = 'metaTags';

    @XoProperty()
    label: string;

    @XoProperty(XoAreaArray)
    areas: XoAreaArray;

    @XoProperty()
    @XoTransient()
    containerAreas: (XoArea & Containing)[] = [];


    /**
     * Replaces all items by their id (recursively)
     * @param items Items to replace
     * @returns true, if at least one item has been replaced
     */
    update(items: XoItem[]): boolean {
        let replaced = false;
        for (const replacer of items) {
            // if replacer is item itself, replace self
            if (replacer.id === this.id) {
                this.decode(replacer.encode());     // encode and decode to get a clean update-process including afterDecode and such
                this.replacedSubject.next(this);
                replaced = true;
            } else if (replacer instanceof XoModellingItem) {
                // check container areas
                for (const area of this.containerAreas) {
                    if (area.update(replacer)) {
                        replaced = true;
                        break;
                    }
                }
            }
        }
        return replaced;
    }


    protected afterDecode() {
        super.afterDecode();
        this.containerAreas = [];
        this.areas ??= new XoAreaArray();
        this.areas.data
            .filter(area => (<Containing><unknown>area).items)
            .forEach(area => this.containerAreas.push(<XoArea & Containing>area));
    }


    getVariables(): XoReferableObject[] {
        const areaVariables: XoReferableObject[] = [];
        this.areas.data.forEach(area => areaVariables.push(...area.getVariables()));
        return [...super.getVariables(), ...areaVariables];
    }


    /**
     * Create object necessary to use this in an insert-request
     * @returns Content for insert-request
     */
    createInsertRequestContent(): XoInsertRequestContent {
        return null;
    }


    /**
     * Defines if it is allowed to have an item before this item
     */
    isPredecessorAllowed(): boolean {
        return true;
    }


    /**
     * Defines if it is allowed to have an item after this item
     */
    isSuccessorAllowed(): boolean {
        return true;
    }
}


@XoArrayClass(XoModellingItem)
export class XoModellingItemArray extends XoArray<XoModellingItem> {
}


@XoObjectClass(XoArea, 'xmcp.processmodeller.datatypes', 'ContainerArea')
export class XoContainerArea extends XoArea implements Containing {

    @XoProperty(XoItemArray)
    items = new XoItemArray();

    @XoProperty()
    itemTypes: string[] = [];


    /**
     * Updates matching item in the container with the passed item
     * @param item Item to replace with
     * @returns true if a matching item could be found to be replaced, false otherwise
     */
    update(item: XoItem): boolean {
        for (let i = 0; i < this.items.length; i++) {
            const containedItem = this.items.data[i];

            // update containedItem itself or items of its areas
            if (containedItem instanceof XoModellingItem) {         /** @todo @fixme find a proper way to update container-areas and modelling-items (using base-class "item") */
                if (containedItem.update([item])) {
                    return true;
                }
            }
        }
        return false;
    }


    getVariables(): XoReferableObject[] {
        const itemVariables: XoReferableObject[] = [];
        this.items.data.forEach(item => itemVariables.push(...item.getVariables()));
        return [...super.getVariables(), ...itemVariables];
    }


    getTargetIndex(sameArea: boolean, moveOperation: boolean, idx: number): number {
        const max = sameArea && moveOperation
            ? this.items.length - 1
            : this.items.length;
        return idx < max ? idx : -1;
    }
}


@XoArrayClass(XoContainerArea)
export class XoContainerAreaArray extends XoArray<XoContainerArea> {
}
