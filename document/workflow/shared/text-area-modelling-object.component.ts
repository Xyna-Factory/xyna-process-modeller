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
import { Component, HostListener } from '@angular/core';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeTextRequest } from '../../../xo/change-text-request.model';
import { XoTextArea } from '../../../xo/text-area.model';
import { ModellingObjectComponent } from './modelling-object.component';


/**
 * Base class for all components, text-actions can be done on
 */
@Component({
    template: ''
})
export class TextAreaModellingObjectComponent extends ModellingObjectComponent {

    getTextArea(): XoTextArea {
        return this.getModel() as XoTextArea;
    }

    setTextArea(value: XoTextArea) {
        this.setModel(value);
    }


    preventEnterKey(): boolean {
        return true;
    }


    finishEditing(text: string) {
        if (text !== this.getTextArea().text && this.getTextArea().id) {
            this.performAction({
                type: ModellingActionType.change,
                objectId: this.getTextArea().id,
                request: new XoChangeTextRequest(undefined, text)
            });
        }
    }


    @HostListener('keydown.enter', ['$event'])
    keydown(event: KeyboardEvent) {
        if (this.preventEnterKey()) {
            event.preventDefault();
        }
    }
}
