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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { TextItem } from '../../../../xo/formula.model';
import { XoItem } from '../../../../xo/item.model';
import { Distance } from '../../shared/drag-and-drop/mod-drag-and-drop.service';

import { ModellingItemComponent } from '../../shared/modelling-object.component';


export type NavigationDirection = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

export interface TemplatePartSwitchFocusEvent {
    part: XoItem & TextItem;
    direction: NavigationDirection;
    srcCaretPosition: number;
}


@Component({
    selector: 'template-part',
    template: '',
    styleUrls: ['./template-part.component.scss']
})
export class TemplatePartComponent extends ModellingItemComponent {

    @Input()
    set part(value: XoItem & TextItem) {
        this.setModel(value);
    }

    get part(): XoItem & TextItem {
        return this.getModel() as XoItem & TextItem;
    }


    @Output()
    readonly switchFocus = new EventEmitter<TemplatePartSwitchFocusEvent>();


    /**
     * @param caretIndex Index of letter to set caret at
     */
    setFocus(caretIndex?: number) {
    }


    /**
     * Returns letter position (in pixels) relative to this component
     * @param s fraction [0..1] in x direction relative to this element
     * @param t fraction [0..1] in y direction relative to this element
     */
    getLetterPositionFromFraction(s: number, t: number): Distance {
        return null;
    }


    /**
     * Returns letter position (in pixels) relative to this component
     * @param index Index of letter
     */
    getLetterPositionFromIndex(index: number): Distance {
        return null;
    }


    keydown(event: KeyboardEvent) {
        // navigation
        const caretPosition = window.getSelection().getRangeAt(0).startOffset;
        const text = this.part.getText();
        let direction: NavigationDirection;
        if (event.key === 'ArrowLeft' && caretPosition === 0) {
            direction = 'LEFT';
        } else if (event.key === 'ArrowRight' && caretPosition === text.length) {
            direction = 'RIGHT';
        } else if (event.key === 'ArrowUp') {
            direction = 'UP';
        } else if (event.key === 'ArrowDown') {
            direction = 'DOWN';
        }

        if (direction) {
            this.switchFocus.emit({ part: this.part, direction, srcCaretPosition: caretPosition });
        }
    }
}
