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
import { Component, ElementRef, HostBinding, Injector, OnDestroy, OnInit } from '@angular/core';

import { OutsideListenerService } from '@zeta/base';
import { XcRichListItemComponent } from '@zeta/xc';

import { XoExceptionMessage } from '../../../xo/exception-message.model';
import { XcModule } from '../../../../../zeta/xc/xc.module';


export interface ExceptionMessageRichListItemData {
    item: XoExceptionMessage;
    isReadonly: () => boolean;
    onclick: (item: XoExceptionMessage, event?: MouseEvent) => void;
    ondelete: (item: XoExceptionMessage, event?: MouseEvent) => void;
}


@Component({
    templateUrl: './exception-message-rich-list-item.component.html',
    styleUrls: ['./exception-message-rich-list-item.component.scss'],
    imports: [XcModule]
})
export class ExceptionMessageRichListItemComponent extends XcRichListItemComponent<void, ExceptionMessageRichListItemData> implements OnInit, OnDestroy {

    private outsideClickHandlerNumber: number;

    get language(): string {
        return this.injectedData.item.language;
    }

    get message(): string {
        return this.injectedData.item.message;
    }

    get readonly(): boolean {
        return this.injectedData.isReadonly();
    }

    constructor(injector: Injector, private readonly elementRef: ElementRef, private readonly outsideListenerService: OutsideListenerService) {
        super(injector);
    }

    ngOnInit() {
        const el = this.elementRef.nativeElement as HTMLElement;

        const clickListener = () => {
            this.injectedData.onclick(this.injectedData.item);
        };
        this.outsideClickHandlerNumber =
        this.outsideListenerService.addOutsideListener(el, 'click', clickListener);
    }

    ngOnDestroy() {
        this.outsideListenerService.removeOutsideListener(this.outsideClickHandlerNumber);
    }

    delete(event: MouseEvent) {
        this.injectedData.ondelete(this.injectedData.item, event);
        this.dismiss();
    }

    // class as css selector
    @HostBinding('class')
    clazz = 'exception-message-rich-list-item';
}
