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
import { XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { BehaviorSubject, Observable } from 'rxjs';

import { DeploymentState, Orderable, XmomObjectType } from '../api/xmom-types';
import { XoContentArea } from './content-area.model';
import { XoItem } from './item.model';
import { XoModellingItem } from './modelling-item.model';
import { XoService } from './service.model';
import { XoVariable } from './variable.model';


@XoObjectClass(XoService, 'xmcp.processmodeller.datatypes', 'Workflow')
export class XoWorkflow extends XoService implements Orderable {

    private readonly revisionSubject = new BehaviorSubject<number>(null);

    @XoProperty(XoContentArea)
    @XoTransient()
    contentArea: XoContentArea;

    @XoProperty()
    @XoTransient()
    defaultWorkflow: boolean;

    deploymentState: DeploymentState;
    saved: boolean;
    modified: boolean;

    /** ID of run order in case this Workflow represents an Audit. Otherwise it's null */
    orderId: string;

    /**
     * Map contains all variables occurring inside of this Workflow by their ID
     * Remark: There can be more than one variable for an ID, e. g. in a mapping input and its formula
     */
    private readonly _variables = new Map<string, XoVariable[]>();


    constructor(_ident?: string) {
        super(_ident);
        this.type = XmomObjectType.Workflow;
    }


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoModellingItem.CONTENT_AREA_NAME) {
                this.contentArea = area as XoContentArea;
            }
        }

        // link branches from exception handling to each output variable, because the output depends on the branches
        if (this.outputArea) {
            this.outputArea.variables.forEach(variable => variable.providingBranches = this.exceptionHandlingArea?.getExceptionHandlingBranches() ?? []);
        }

        // build variables map
        this.updateVariableMap();
    }


    /**
     * @inheritdoc
     */
    update(items: XoItem[]): boolean {
        const result = super.update(items);

        // rebuild variable map, because it could have changed after the update
        this.updateVariableMap();

        return result;
    }


    /**
     * Builds a map over all variables occurring inside of this Workflow. Has to be called each time, the Workflow's variable objects change (e. g. on each revision change)
     */
    updateVariableMap() {
        this._variables.clear();
        this.getVariables().forEach((variable: XoVariable) => {
            const variables = this._variables.get(variable.id) || [];
            variables.push(variable);
            this._variables.set(variable.id, variables);
        });
    }


    getVariablesById(id: string): XoVariable[] {
        return this._variables.get(id);
    }


    clearVariableConnections() {
        this._variables.forEach(variables =>
            variables.forEach(variable => variable.inConnections.splice(0))
        );
    }


    get revision(): number {
        return this.revisionSubject.value;
    }


    set revision(value: number) {
        this.revisionSubject.next(value);
    }


    get revisionChange(): Observable<number> {
        return this.revisionSubject.asObservable();
    }
}
