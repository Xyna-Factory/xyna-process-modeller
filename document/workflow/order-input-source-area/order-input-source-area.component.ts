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
import { Component, inject, Input, OnInit } from '@angular/core';

import { DocumentService } from '@pmod/document/document.service';
import { XcAutocompleteDataWrapper, XcOptionItemString } from '@zeta/xc';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeOrderInputSourceRequest } from '../../../xo/change-orderinputsource-request.model';
import { XoInvocation } from '../../../xo/invocation.model';
import { XoOrderInputSourceArea } from '../../../xo/order-input-source-area.model';
import { ModellingObjectComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'order-input-source-area',
    templateUrl: './order-input-source-area.component.html',
    styleUrls: ['./order-input-source-area.component.scss'],
    standalone: false
})
export class OrderInputSourceAreaComponent extends ModellingObjectComponent implements OnInit {

    protected readonly documentService = inject(DocumentService);

    private _invocation: XoInvocation;
    private invalidated = true;


    oisDataWrapper = new XcAutocompleteDataWrapper(
        () => this.orderInputSourceArea?.usedInputSource ? this.orderInputSourceArea.usedInputSource.name : null,
        value => {
            if (this.orderInputSourceArea?.usedInputSource) {
                this.performAction({
                    type: ModellingActionType.change,
                    request: XoChangeOrderInputSourceRequest.withName(value || ''),
                    objectId: this.orderInputSourceArea.usedInputSource.id || 'NO_ID'
                });
            }
        }
    );


    ngOnInit() {
        super.ngOnInit();
        this.untilDestroyed(this.messageBus.oisChange).subscribe(() => {
            this.invalidated = true;

            // in case of no available OIS, directly trigger update
            if (this.oisDataWrapper.values?.length === 0) {
                this.updateOrderInputSources();
            }
        });
    }


    updateOrderInputSources() {
        if (!this.isCollapsed() && this.invocation && this.invalidated) {
            this.documentService.xmomService.getOrderInputSources(this.invocation).subscribe(oisources => {

                // there are no OIS-change-events yet (YG-2), so always update OISes
                // this.invalidated = false;

                this.oisDataWrapper.values = oisources.data.map(ois => XcOptionItemString(ois.name));
                if (this.oisDataWrapper.values.length > 0) {
                    this.oisDataWrapper.values.unshift(XcOptionItemString());
                }
                this.oisDataWrapper.update();
            });
        }
    }


    @Input()
    set orderInputSourceArea(value: XoOrderInputSourceArea) {
        this.setModel(value);
    }


    get orderInputSourceArea(): XoOrderInputSourceArea {
        return this.getModel() as XoOrderInputSourceArea;
    }


    collapsedChanged(collapsed: boolean) {
        super.collapsedChanged(collapsed);
        this.updateOrderInputSources();
    }


    openedDropdown() {
        this.updateOrderInputSources();
    }


    @Input()
    set invocation(value: XoInvocation) {
        this._invocation = value;
        this.updateOrderInputSources();
    }


    get invocation(): XoInvocation {
        return this._invocation;
    }
}
