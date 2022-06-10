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
import { TextItem, XoFormula } from '../../../../xo/formula.model';
import { XoItem } from '../../../../xo/item.model';
import { XoVariable } from '../../../../xo/variable.model';
import { TemplateText } from './template-text.model';


export class TemplateRow extends XoItem {
    private readonly _templateParts: (XoItem & TextItem)[] = [];

    /**
     * Variables provided by the template formula
     */
    private _variables: XoVariable[] = [];


    /**
     * @return Actually added part (if merged, result !== part)
     */
    addPart(part: XoItem & TextItem, index?: number): (XoItem & TextItem) {
        index = isNaN(index) ? this.templateParts.length : index;

        // a formula must be preceded by a text
        if (part instanceof XoFormula && (index === 0 || this.templateParts[index - 1] instanceof XoFormula)) {
            this.templateParts.splice(index, 0, TemplateText.withText(''));
            index++;
        }

        // merge adjacent text-parts
        const leftPart = index > 0 ? this.templateParts[index - 1] : null;
        const rightPart = index < this.templateParts.length ? this.templateParts[index] : null;
        if (part instanceof TemplateText && leftPart instanceof TemplateText) {
            leftPart.setText(leftPart.getText() + part.getText());
            return leftPart;
        }
        if (part instanceof TemplateText && rightPart instanceof TemplateText) {
            rightPart.setText(part.getText() + rightPart.getText());
            return rightPart;
        }

        this.templateParts.splice(index, 0, part);
        return part;
    }


    get templateParts(): (XoItem & TextItem)[] {
        return this._templateParts;
    }


    get variables(): XoVariable[] {
        return this._variables;
    }


    set variables(value: XoVariable[]) {
        this._variables = value;
    }


    get empty(): boolean {
        return this.templateParts.length === 0;
    }


    get expression(): string {
        // filter out empty parts (explicitly check "text", not "value")
        return this.templateParts.filter(part => !!part.getText()).map(part => part.getTemplateValue()).join(',') || '""';
    }


    toString(): string {
        return this.templateParts.filter(part => !!part.getText()).map(part => part.getText()).join(' ') || '';
    }
}
