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
import { Injectable } from '@angular/core';

import { XoReferableObject } from '../xo/referable-object.model';
import { DocumentItem } from './model/document.model';
import { ModellingObjectComponent } from './workflow/shared/modelling-object.component';


@Injectable()
export class ComponentMappingService {
    /**
     * (DocumentItem, string) -> ModellingObject
     *
     * documentItem: Document Item (is XoXmomItem) where mapped component is part of
     * string: ID of the mapped component's Xo
     * ModellingObjectComponent: Mapped component
     */
    private readonly _componentMap = new Map<DocumentItem, Map<string, ModellingObjectComponent>>();


    getComponentForId(documentItem: DocumentItem, id: string): ModellingObjectComponent {
        const documentMap = this._componentMap.get(documentItem);
        return documentMap ? documentMap.get(id) : null;
    }


    addComponentForId(documentItem: DocumentItem, component: ModellingObjectComponent, id: string) {
        if (documentItem && id) {
            const documentMap = this._componentMap.get(documentItem);
            if (documentMap) {
                documentMap.set(id, component);
            } else {
                this._componentMap.set(documentItem, new Map<string, ModellingObjectComponent>([[id, component]]));
            }
        }
    }


    addComponentForItem(component: ModellingObjectComponent, item: XoReferableObject) {
        if (item) {
            const root = item.root as DocumentItem;
            if (root) {
                this.addComponentForId(root, component, item.id);
            }
        }
    }


    removeComponentForId(documentItem: DocumentItem, id: string) {
        if (documentItem && id) {
            const documentMap = this._componentMap.get(documentItem);
            if (documentMap) {
                documentMap.delete(id);
                if (documentMap.size === 0) {
                    this._componentMap.delete(documentItem);
                }
            }
        }
    }


    removeComponentForObject(model: XoReferableObject) {
        if (model) {
            const root = model.root as DocumentItem;
            if (root) {
                this.removeComponentForId(root, model.id);
            }
        }
    }


    removeComponentsForRoot(documentItem: DocumentItem) {
        const documentMap = this._componentMap.get(documentItem);
        documentMap?.clear();
        this._componentMap.delete(documentItem);
    }
}
