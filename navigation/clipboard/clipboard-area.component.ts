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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ModellingActionType } from '../../api/xmom.service';
import { ModRelativeHoverSide } from '../../document/workflow/shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDragEvent, ModDropEvent } from '../../document/workflow/shared/drag-and-drop/mod-drop-area.directive';
import { TriggeredAction } from '../../document/workflow/shared/modelling-object.component';
import { XoBranch } from '../../xo/branch.model';
import { XoClipboardEntryData } from '../../xo/clipboard-entry.model';
import { XoCopyToClipboardRequest } from '../../xo/copy-to-clipboard-request.model';
import { XoFormula } from '../../xo/formula.model';
import { XoContainerArea, XoModellingItem } from '../../xo/modelling-item.model';


@Component({
    selector: 'clipboard-area',
    templateUrl: './clipboard-area.component.html',
    styleUrls: ['./clipboard-area.component.scss'],
    standalone: false
})
export class ClipboardAreaComponent {

    @Input()
    clipboardArea: XoContainerArea;

    @Output()
    readonly triggerAction = new EventEmitter<TriggeredAction>();

    allowItem = (xoFqn: string, xoId?: string): boolean => true;

    canDrop = (xo: XoModellingItem, event?: ModDragEvent): boolean => {
        if (xo.id && (event.side === ModRelativeHoverSide.top || event.side === ModRelativeHoverSide.bottom)) {
            const fromClipboard = !!(xo.data as XoClipboardEntryData).$clipboard;
            const forbiddenItem = xo instanceof XoBranch || xo.parent instanceof XoFormula;
            return !fromClipboard && !forbiddenItem;
        }
        return false;
    };


    dropped(event: ModDropEvent) {
        this.performAction({
            objectId: event.item.id,
            type: ModellingActionType.copyToClipboard,
            request: new XoCopyToClipboardRequest(undefined, event.index)
        });
    }


    performAction(action: TriggeredAction) {
        this.triggerAction.emit(action);
    }


    getTooltip(item: XoModellingItem): string {
        const data: XoClipboardEntryData = item.data as XoClipboardEntryData;
        if (data.$clipboard) {
            const rtc = data.$clipboard.originalRtc?.runtimeContext().uniqueKey ?? '';
            const fqn = data.$clipboard.originalFqn ?? '';
            return fqn + (rtc ? ' (' + rtc + ')' : '');
        }
    }
}
