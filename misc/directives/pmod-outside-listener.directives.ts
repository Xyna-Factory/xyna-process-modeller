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
import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';

import { OutsideListenerService } from '@zeta/base';


@Directive({ selector: '[pmod-outside-listener]' })
export class PmodOutsideListenerDirective implements OnInit, OnDestroy {
    private readonly element = inject(ElementRef);
    private readonly outsideListenerService = inject(OutsideListenerService);


    private _handlerNum: number;

    @Output('pmod-outside-listener')
    readonly outsideListener = new EventEmitter<Event>();

    @Input('pmod-outside-event')
    outsideEvent: string;

    ngOnInit() {
        if (this.element && this.element.nativeElement) {
            const element = this.element.nativeElement as HTMLElement;
            const _listener = (event: Event) => {
                this.outsideListener.emit(event);
            };
            if (this.outsideEvent) {
                this._handlerNum = this.outsideListenerService.addOutsideListener(element, this.outsideEvent, _listener);
            } else {
                console.warn('PmodOutsideListenerDirective: no event found', this.element);
            }
        } else {
            console.warn('PmodOutsideListenerDirective: no element found', this.element);
        }
    }

    ngOnDestroy() {
        if (this._handlerNum) {
            this.outsideListenerService.removeOutsideListener(this._handlerNum);
        }
    }

}
