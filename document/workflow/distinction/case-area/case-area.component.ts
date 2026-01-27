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
import { Component, inject, Input } from '@angular/core';

import { ModellingActionType } from '@pmod/api/xmom.service';
import { ConflictDialogComponent, ConflictDialogData } from '@pmod/document/modal/conflict-dialog/conflict-dialog.component';
import { XoCase } from '@pmod/xo/case.model';
import { XoModellingItem } from '@pmod/xo/modelling-item.model';
import { XoMoveModellingObjectRequest } from '@pmod/xo/move-modelling-object-request.model';
import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { XoCaseArea } from '../../../../xo/case-area.model';
import { ModDnDEvent } from '../../shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDragEvent, ModDropEvent, ModDropAreaDirective } from '../../shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent, TriggeredAction } from '../../shared/modelling-object.component';
import { CaseComponent } from '../case/case.component';
import { ModDraggableDirective } from '../../shared/drag-and-drop/mod-draggable.directive';


@Component({
    selector: 'case-area',
    templateUrl: './case-area.component.html',
    styleUrls: ['./case-area.component.scss'],
    imports: [ModDropAreaDirective, CaseComponent, ModDraggableDirective]
})
export class CaseAreaComponent extends ModellingObjectComponent {

    protected readonly i18n = inject(I18nService);
    protected readonly dialogService = inject(XcDialogService);

    allowItem = (xoFqn: string): boolean => {
        const allowedType = !!this.caseArea.itemTypes.find(itemType => itemType.toLowerCase() === xoFqn.toLowerCase());
        return allowedType && !this.readonly;
    };

    canDrop = (xo: XoModellingItem, _hoverEvent?: ModDragEvent, _dragEvent?: ModDnDEvent): boolean => {
        if (xo instanceof XoCase) {
            const sameMergeGroup = xo.mergeGroup && this.caseArea.cases.every(c => c.mergeGroup === xo.mergeGroup);
            const sameBranch     = this.caseArea.cases.includes(xo);
            return sameMergeGroup && !sameBranch;
        }
        return false;
    };

    dropped(event: ModDropEvent) {
        const request = new XoMoveModellingObjectRequest(undefined, -1, this.caseArea.id);
        request.force = false;

        const action: TriggeredAction = {
            type: ModellingActionType.move,
            objectId: event.item.id,
            request
        };

        action.errorHandler = () => {
            action.errorHandler = undefined;
            // show dialog to resolve conflict
            this.dialogService.custom(
                ConflictDialogComponent,
                <ConflictDialogData>{
                    title: this.i18n.translate('pmod.workflow.case.merge-title'),
                    message: this.i18n.translate('pmod.workflow.case.merge-message'),
                    handlings: [
                        {
                            key:         'USE_DESTINATION',
                            value:       this.i18n.translate('pmod.workflow.case.merge-use-destination'),
                            description: this.i18n.translate('pmod.workflow.case.merge-use-destination-description')
                        },
                        {
                            key:         'USE_SOURCE',
                            value:       this.i18n.translate('pmod.workflow.case.merge-use-source'),
                            description: this.i18n.translate('pmod.workflow.case.merge-use-source-description')
                        },
                        {
                            key:         'APPEND',
                            value:       this.i18n.translate('pmod.workflow.case.merge-append'),
                            description: this.i18n.translate('pmod.workflow.case.merge-append-description')
                        }
                    ]
                }
            ).afterDismissResult().subscribe(result => {
                request.force = true;
                request.conflictHandling = result;
                this.performAction(action);
            });
        };

        this.performAction(action);
    }


    @Input()
    set caseArea(value: XoCaseArea) {
        this.setModel(value);
    }


    get caseArea(): XoCaseArea {
        return this.getModel() as XoCaseArea;
    }
}
