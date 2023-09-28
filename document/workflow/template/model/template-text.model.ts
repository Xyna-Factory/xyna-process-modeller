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
import { BehaviorSubject, Observable } from 'rxjs';

import { TextItem } from '../../../../xo/formula.model';
import { XoItem } from '../../../../xo/item.model';


export class TemplateText extends XoItem implements TextItem {
    private readonly textSubject = new BehaviorSubject<string>('');


    private static escaped(s: string): string {
        s = s.replace(/\\/g, '\\\\');   // replace \ with \\
        s = s.replace(/"/g, '\\"');    // replace " with \"
        s = s.replace(/\n/g, '\\n');   // replace new line with \n
        return s;
    }


    static unescaped(s: string): string {
        // replace \n (which is not preceeded by additional backslashes or the beginning) with new line
        s = s.replace(/((^|(?<=[^\\]))(\\\\)*)\\n/g, '$1\n');

        // replace \" and \\ with " and \
        s = s.replace(/\\(["\\])/gm, '$1');
        return s;
    }


    getText(): string {
        return this.textSubject.getValue();
    }


    get textChange(): Observable<string> {
        return this.textSubject.asObservable();
    }


    setText(value: string) {
        if (value !== this.getText()) {
            this.textSubject.next(value);
        }
    }


    getValue(): string {
        return `"${this.getText()}"`;
    }


    getTemplateValue(): string {
        // escape escapeworthy content
        // ... as long as it hasn't been escaped, yet
        return `"${TemplateText.escaped(this.getText())}"`;
    }


    /**
     * Returns index of the letter at fraction s
     * @param s fraction [0..1] in x direction relative to this text (assuming a monospace font)
     */
    getLetterIndex(s: number): number {
        return Math.round(this.getText().length * s);
    }


    static withText(text: string): TemplateText {
        const result = new TemplateText();
        result.setText(text);
        return result;
    }
}
