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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, Input, Optional } from '@angular/core';

import { ApiService } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcLocalTableDataSource } from '@zeta/xc';

import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoStorablePropertyArea } from '../../../xo/storable-property-area.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';


@Component({
    selector: 'storable-properties-area',
    templateUrl: './storable-properties-area.component.html',
    styleUrls: ['./storable-properties-area.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class StorablePropertiesAreaComponent extends ModellingObjectComponent {

    private readonly i18n: I18nService;

    readonly dataSource = new XcLocalTableDataSource<XoStorablePropertyArea>();


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        private readonly apiService: ApiService,
        private readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);
        this.i18n = injector.get(I18nService);
    }


    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    @Input()
    set storablePropertyArea(value: XoStorablePropertyArea) {
        this.setModel(value);

        const rows = [];
        const unwrapRows = (area: XoStorablePropertyArea, indentation = '') => {
            const row = area.clone();
            row.label = indentation + (area.label ?? '<none>') + (area.isFlattened ? ' (flattened)' : '');
            rows.push(row);
            area.children.forEach(child => unwrapRows(child, indentation + '    '));
        };
        unwrapRows(value);

        const context = 'pmod.datatype.member-variable-details.storable-properties-area.';
        this.dataSource.localTableData = {
            rows: rows,
            columns: [
                { name: this.i18n.translate(context + 'variable'), path: 'label', pre: true },
                { name: this.i18n.translate(context + 'persistence-field-name'), path: 'fieldName' },
                { name: this.i18n.translate(context + 'reference'), path: 'isReference' },
                { name: this.i18n.translate(context + 'index'), path: 'isIndex' },
                { name: this.i18n.translate(context + 'unique'), path: 'isUnique' }
            ]
        };
        this.dataSource.refresh();
    }


    get storablePropertyArea(): XoStorablePropertyArea {
        return this.getModel() as XoStorablePropertyArea;
    }
}
