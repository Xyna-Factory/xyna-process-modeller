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
import { Component, ElementRef, HostBinding, Injector, Input, OnDestroy, Optional, QueryList, ViewChildren } from '@angular/core';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';

import { ApiService } from '@zeta/api';
import { XcMenuItem } from '@zeta/xc';

import { ModellingActionType } from '../../../api/xmom.service';
import { XoChangeFormulaRequest } from '../../../xo/change-formula-request.model';
import { XoChangeMultiplicityRequest } from '../../../xo/change-multiplicity-request.model';
import { XoDeleteRequest } from '../../../xo/delete-request.model';
import { XoFormula } from '../../../xo/formula.model';
import { XoTemplate } from '../../../xo/template.model';
import { FormulaPart } from '../../../xo/util/formula-parts/formula-part';
import { FormulaPartLiteral } from '../../../xo/util/formula-parts/formula-part-literal';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { ModellingItemComponent, TriggeredAction } from '../shared/modelling-object.component';
import { TemplateRow } from './model/template-row.model';
import { TemplateText } from './model/template-text.model';
import { SplitTemplateRowEvent, SwitchTemplateRowFocusEvent, TemplateRowComponent } from './template-row/template-row.component';
import { XoChangeLabelRequest } from '@pmod/xo/change-label-request.model';


enum ConcatParameterType {
    text,
    formula
}


interface ConcatParameter {
    type: ConcatParameterType;
    value: string;
}


@Component({
    selector: 'template',
    templateUrl: './template.component.html',
    styleUrls: ['./template.component.scss']
})
export class TemplateComponent extends ModellingItemComponent implements OnDestroy {

    private static readonly LOCALE_READONLY_MODE = 'Switch to Readonly Mode';   // TODO: i18n - use language key
    private static readonly LOCALE_EDIT_MODE = 'Switch to Edit Mode';   // TODO: i18n - use language key

    @HostBinding('class.template') templateClass = true;

    rows: TemplateRow[] = [];
    rowComponents: QueryList<TemplateRowComponent>;
    formula: XoFormula;
    private rowWaitingForFocus: TemplateRow = null;

    private _readonlyMode = false;
    readonlyContent = '';       // readonly content is only evaluated once changing into readonly mode
    private readonly readonlyMenuItem: XcMenuItem;


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        readonly detailLevelService: WorkflowDetailLevelService,
        private readonly apiService: ApiService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        this.readonlyMenuItem = <XcMenuItem>{
            name: TemplateComponent.LOCALE_READONLY_MODE,
            translate: true,
            click: item => {
                this.readonlyMode = !this.readonlyMode;
                item.name = this.readonlyMode ? TemplateComponent.LOCALE_EDIT_MODE : TemplateComponent.LOCALE_READONLY_MODE;
            }
        };
        this.menuItems.push(...[
            this.readonlyMenuItem
        ]);
    }


    protected initTemplate() {
        if (this.formula && this.documentModel) {
            this.decode(this.formula);
        }
    }


    @Input()
    set template(value: XoTemplate) {
        this.setModel(value);
    }


    get template(): XoTemplate {
        return this.getModel() as XoTemplate;
    }


    modelChanged() {
        super.modelChanged();

        // parse formula (expect only one formula for a template-mapping)
        this.rows.splice(0);
        if (this.template.formulaArea.formulas.length > 0) {
            this.formula = this.template.formulaArea.formulas[0];
            this.initTemplate();
        } else {
            console.log(`WARNING: Expecting a formula inside a template mapping, but there is none for ${this.template.id}!`);
        }
    }


    afterDocumentModelSet() {
        super.afterDocumentModelSet();
        this.initTemplate();
    }


    decode(formula: XoFormula) {
        formula.parseExpression(this.apiService, this.documentModel.originRuntimeContext);
        const parameterStartIndex = formula.parts.findIndex(part => part.text.startsWith('concat'));
        const parameters = this.extractParameters(formula.parts.slice(parameterStartIndex + 2, formula.parts.length - 1));

        let currentRow = new TemplateRow();
        currentRow.variables = formula.input.data;
        this.rows.push(currentRow);

        // each parameter of concat will either be text or a formula
        parameters.forEach(parameter => {
            if (parameter.type === ConcatParameterType.text) {
                // text ------------
                // delete "" at start and end of literal
                let text = parameter.value.substr(1, parameter.value.length - 2);

                // unescape text
                text = TemplateText.unescaped(text);

                // look for a linebreak and create a new row
                const lines = text.split(/\n/);
                for (let i = 0; i < lines.length; i++) {
                    if (i > 0) {
                        // linebreak
                        // -> if row is empty, add empty text
                        if (currentRow.empty) {
                            currentRow.addPart(TemplateText.withText(''));
                        }

                        // -> create new row
                        currentRow = new TemplateRow();
                        currentRow.variables = formula.input.data;
                        this.rows.push(currentRow);
                    }
                    if (lines[i]) {
                        currentRow.addPart(TemplateText.withText(lines[i]));
                    }
                }
            } else {
                // formula ---------
                const formulaParameter = new XoFormula();
                formulaParameter.expression = parameter.value;
                formulaParameter.input = formula.input;
                formulaParameter.output = formula.output;
                formulaParameter.mergeVariables();
                formulaParameter.parseExpression(this.apiService, this.documentModel.originRuntimeContext);
                currentRow.addPart(formulaParameter);
            }
        });

        // add empty text, if row is empty
        if (currentRow.templateParts.length === 0) {
            currentRow.addPart(TemplateText.withText(''));
        }
    }


    encode(numVariables: number): XoFormula {
        const formula = new XoFormula();
        formula.expression = `%${numVariables - 1}%.text=concat(` + this.rows.map(row => row.expression).join(',"\\n",') + ')';
        formula.input = this.formula.input;
        formula.output = this.formula.output;
        formula.mergeVariables();
        return formula;
    }


    /**
     * Returns function-parameters (encoded into parts and separated by ',') as string array
     */
    extractParameters(parts: FormulaPart[]): ConcatParameter[] {
        const parameters: ConcatParameter[] = [];

        // only classify formula-parts of depth 0 as text
        // not each ',' separates two parameters. Only that of depth 0 (i.e. with empty bracket stack)
        const bracketStack = [];
        let currentParameter: ConcatParameter;

        parts.forEach(part => {
            if (part.part === ',' && bracketStack.length === 0) {
                parameters.push(currentParameter);
                currentParameter = null;
            } else {
                if (!currentParameter) {
                    currentParameter = part instanceof FormulaPartLiteral ? { type: ConcatParameterType.text, value: '' } : { type: ConcatParameterType.formula, value: '' };
                }

                /* Formulas either (1) contain valid bracing or, if not, (2) are embraced by '{}'.
                 * (1) stack grows and burns down by matching braces
                 * (2) if the parameter starts with a '{', the whole stack empties with a '}', no matter what is in between
                 */
                const lastBracket = bracketStack.length > 0 ? bracketStack[bracketStack.length - 1] : null;
                if (part.part === '(' || part.part === '[' || part.part === '{') {
                    bracketStack.push(part.part);
                } else if (currentParameter.value.startsWith('{') && part.part === '}') {
                    // (2)
                    bracketStack.splice(0);
                } else if (lastBracket && (
                    part.part === ')' && lastBracket === '(' ||
                    part.part === ']' && lastBracket === '[' ||
                    part.part === '}' && lastBracket === '{')
                ) {
                    // (1)
                    bracketStack.pop();
                }
                currentParameter.value += part.part;
            }
        });
        // push last parameter
        if (currentParameter) {
            parameters.push(currentParameter);
        }
        return parameters;
    }


    /**
     * intercept performAction and assemble template-mapping out of template rows
     */
    performAction(event: TriggeredAction) {
        if (event.request instanceof XoChangeLabelRequest ||
            event.request instanceof XoChangeMultiplicityRequest ||
            event.request instanceof XoDeleteRequest
        ) {
            // allow change and delete of variables in the ordinary way
            super.performAction(event);
        } else {
            let numVariables = this.formula.variables.length;
            if (event.type === ModellingActionType.insert) {
                numVariables++;
            }
            const newFormula = this.encode(numVariables);

            // transform action such that it fits the assembled formula
            const transformAction = (action: TriggeredAction): TriggeredAction => ({
                type: action.type,
                objectId: this.formula.id,
                request: action.type === ModellingActionType.change
                    ? new XoChangeFormulaRequest(undefined, newFormula.expression)
                    : action.request,
                subsequentAction: action.subsequentAction
                    ? transformAction(action.subsequentAction)
                    : null
            });

            if (this.formula && this.formula.expression !== newFormula.expression) {
                super.performAction(transformAction(event));
                this.formula.expression = newFormula.expression;
            }
        }
    }


    get readonlyMode(): boolean {
        return this._readonlyMode;
    }


    set readonlyMode(value: boolean) {
        // evaluate readonly content
        this._readonlyMode = value;
        this.readonlyContent = this.rows.map(row => row.toString()).join('\n');
    }


    blur(relatedTarget: Element) {
        if (!this.elementRef.nativeElement.contains(relatedTarget)) {
            this.performAction({
                type: ModellingActionType.change,
                objectId: null,
                request: null
            });
        }
    }


    splitRows(event: SplitTemplateRowEvent) {
        const rowIndex = this.rows.findIndex(row => row === event.beneathRow);
        this.rows.splice(rowIndex + 1, 0, event.newRow);
        this.rowWaitingForFocus = event.newRow;
    }


    mergeRows(rowToMerge: TemplateRow) {
        // merge passed row with upper one
        const rowIndex = this.rows.findIndex(row => row === rowToMerge);
        if (rowIndex > 0) {
            // merge upper row into the one below and remove upper one afterwards (to keep focus)
            const upperRow = this.rows[rowIndex - 1];
            for (let i = upperRow.templateParts.length - 1; i >= 0; i--) {
                rowToMerge.addPart(upperRow.templateParts[i], 0);
            }
            this.rows.splice(rowIndex - 1, 1);
        }
    }


    switchRowFocus(event: SwitchTemplateRowFocusEvent) {
        const sourceIndex = this.rows.findIndex(row => row === event.source);
        const targetIndex = event.direction === 'UP' ? sourceIndex - 1 : sourceIndex + 1;
        const targetRow = this.rowComponents.get(Math.min(this.rowComponents.length - 1, Math.max(0, targetIndex)));
        targetRow.setFocus(event.srcCaretPosition);
    }


    /**
     * Set focus to row
     */
    @ViewChildren('templateRow')
    private set templateRows(rows: QueryList<TemplateRowComponent>) {
        this.rowComponents = rows;

        // focus row if there is a waiting one
        if (this.rowWaitingForFocus) {
            const rowComponent = this.rowComponents.find(row => row.row === this.rowWaitingForFocus);
            rowComponent?.setFocus();
            this.rowWaitingForFocus = null;
        }
    }
}
