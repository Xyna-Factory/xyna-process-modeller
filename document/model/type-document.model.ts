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
import { DocumentItem, DocumentModel } from './document.model';


export abstract class TypeDocumentModel<T extends DocumentItem = DocumentItem> extends DocumentModel<T> {

    /**
     * Updated by document service upon downloading this document's template
     */
    downloading = false;

    /**
     * necessary for undeployed types that don't have a specific fqn yet
     */
    newTypePath = '';


    get name(): string {
        return this.item?.label ?? '';
    }


    get revision(): number {
        return this.item.revision;
    }
}
