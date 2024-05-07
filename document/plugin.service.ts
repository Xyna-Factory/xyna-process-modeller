/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { XoGuiDefiningWorkflow } from '@yggdrasil/plugin/gui-defining-workflow.model';
import { ApiService, StartOrderOptionsBuilder, Xo, XoManagedFileID, XoXPRCRuntimeContext, XoXPRCRuntimeContextFromRuntimeContext } from '@zeta/api';
import { XcDialogService } from '@zeta/xc';
import { XcDialogDefinitionComponent } from '@zeta/xc/xc-form/definitions/xc-dialog-definition/xc-dialog-definition.component';
import { XoDefinition, XoDefinitionBundle, XoDefinitionObserver } from '@zeta/xc/xc-form/definitions/xo/base-definition.model';
import { XoStartOrderButtonDefinition } from '@zeta/xc/xc-form/definitions/xo/item-definition.model';
import { Observable, filter, map, of, throwError } from 'rxjs';


/**
 * Manages Plugin system.
 * - call workflows to define Plugin UI
 * - caches results from workflows
 */
@Injectable()
export class PluginService implements XoDefinitionObserver {

    constructor(private readonly apiService: ApiService, private readonly dialogs: XcDialogService) { }

    /**
     * holds the results from workflows
     */
    private readonly definedUICache = new Map<string,  XoDefinitionBundle>();

    getFromCacheOrCallWorkflow(definingWorkflow: XoGuiDefiningWorkflow): Observable<XoDefinitionBundle> {
        let bundle: XoDefinitionBundle = this.definedUICache.get(definingWorkflow.uniqueKey);

        if (bundle) {
            return of(bundle);
        }

        return this.apiService.startOrder(
            definingWorkflow.zetaRTC,
            definingWorkflow.fQN,
            null,
            null,
            new StartOrderOptionsBuilder().withErrorMessage(true).options
        ).pipe(
            filter(result => {
                if (result.errorMessage || result.output?.length === 0) {
                    throwError(() => new Error('no definition found'));
                    this.dialogs.error('No definition found in resolved definition-Workflow');
                    return false;
                }
                return true;
            }),
            map(result => {
                bundle = <XoDefinitionBundle>{
                    definition: result.output[0],
                    data: result.output.slice(1)
                };
                this.definedUICache.set(definingWorkflow.uniqueKey, bundle);
                return bundle;
            })
        );
    }

    // ========================================================================================================================
    // XO DEFINITION OBSERVER
    // ========================================================================================================================


    openDialog(definition: XoDefinition, data: Xo[]): Observable<Xo[]> {
        return this.dialogs.custom(XcDialogDefinitionComponent, {definition: definition, data: data}).afterDismiss();
    }


    resolveDefinition(definitionWorkflowRTC: XoXPRCRuntimeContext, definitionWorkflowFQN: string, data: Xo[]): Observable<XoDefinitionBundle> {
        const definingWorkflow: XoGuiDefiningWorkflow = new XoGuiDefiningWorkflow();
        definingWorkflow.fQN = definitionWorkflowFQN;
        definingWorkflow.runtimeContext = definitionWorkflowRTC;
        definingWorkflow.zetaRTC = definitionWorkflowRTC.toRuntimeContext();
        return this.getFromCacheOrCallWorkflow(definingWorkflow);
    }


    translate(value: string): string {
        return value;
    }


    getDefaultRTC(): XoXPRCRuntimeContext {
        return XoXPRCRuntimeContextFromRuntimeContext(environment.zeta.xo.runtimeContext);
    }


    startOrder(definition: XoStartOrderButtonDefinition, input: Xo | Xo[]): Observable<Xo | Xo[]> {
        const rtc = (definition.serviceRTC ? definition.serviceRTC : this.getDefaultRTC()).toRuntimeContext();
        return this.apiService.startOrder(
            rtc,
            definition.serviceFQN,
            input, null,
            new StartOrderOptionsBuilder().withErrorMessage(true).async(!definition.synchronously).options
        ).pipe(map(result => result.output));
    }

    uploadFile?(host?: string): Observable<XoManagedFileID> {
        return this.apiService.upload(undefined, host);
    }
}
