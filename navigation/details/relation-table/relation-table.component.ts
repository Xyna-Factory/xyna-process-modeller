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
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { XMOMListComponent } from '@pmod/navigation/xmom/xmom-list.component';
import { XoFactoryItemArray } from '@pmod/xo/factory-item.model';
import { RelationTypeEnum, XoGetXmomRelationsResponse } from '@pmod/xo/get-xmom-relations-response.model';


export interface RelationGroup {
    type: string;
    relations: XoFactoryItemArray;
    visible: boolean;
}

@Component({
    selector: 'relation-table',
    templateUrl: './relation-table.component.html',
    styleUrls: ['./relation-table.component.scss'],
    standalone: false
})
export class RelationTableComponent {
    @ViewChild(XMOMListComponent, { static: true })
    xmomList: XMOMListComponent;

    @Input()
    set relations(value: any) {
        this.groupedRelationList = [];
        this.groupRelations(value);
    }

    @Output()
    readonly refresh = new EventEmitter<void>();

    private readonly defaultExpand = true;
    groupedRelationList: RelationGroup[] = [];

    private groupRelations(relations: XoGetXmomRelationsResponse) {
        if (relations) {
            Object.entries(RelationTypeEnum).forEach(([key, type]) => {
                if (relations[key] instanceof XoFactoryItemArray) {
                    this.groupedRelationList.push({
                        type,
                        relations: relations[key],
                        visible: this.defaultExpand
                    });
                }
            });
        }
    }
}
