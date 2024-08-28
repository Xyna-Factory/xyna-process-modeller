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
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { TriggeredAction } from '@pmod/document/workflow/shared/modelling-object.component';
import { FilterConditionData } from '@pmod/navigation/search/search.component';
import { XoDeleteRequest } from '@pmod/xo/delete-request.model';
import { XoGetIssuesResponse } from '@pmod/xo/get-issues-response.model';
import { XoGetWarningsResponse } from '@pmod/xo/get-warnings-response.model';
import { XoUnlockResponse } from '@pmod/xo/unlock-response.model';
import { FullQualifiedName, RuntimeContext, XoClassInterface, XoJson } from '@zeta/api';

import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import { XoCloseResponse } from '../xo/close-response.model';
import { XoData } from '../xo/data.model';
import { XoDynamicMethodInvocation } from '../xo/dynamic-method-invocation.model';
import { XoError } from '../xo/error.model';
import { XoException } from '../xo/exception.model';
import { XoGetClipboardResponse } from '../xo/get-clipboard-response.model';
import { XoGetDataTypeResponse } from '../xo/get-data-type-response.model';
import { XoGetDataflowResponse } from '../xo/get-dataflow-response.model';
import { XoGetExceptionTypeResponse } from '../xo/get-exception-type-response.model';
import { XoGetObjectXMLResponse } from '../xo/get-object-xml-response.model';
import { XoGetOrderInputSourcesResponse } from '../xo/get-order-input-sources-response.model';
import { XoGetRemoteDestinationResponse } from '../xo/get-remote-destination-response.model';
import { XoGetServiceGroupResponse } from '../xo/get-service-group-response.model';
import { XoGetWorkflowResponse } from '../xo/get-workflow-response.model';
import { XoGetXMLResponse } from '../xo/get-xml-response.model';
import { XoGetXmomItemResponse } from '../xo/get-xmom-item-response.model';
import { XoGetXmomRelationsResponse } from '../xo/get-xmom-relations-response.model';
import { XoOrderInputSourceArray } from '../xo/order-input-source.model';
import { XoRemoteDestinationArray } from '../xo/remote-destination.model';
import { XoApplication, XoRuntimeContext, XoWorkspace } from '../xo/runtime-context.model';
import { XoServiceGroup } from '../xo/service-group.model';
import { XoSetDataflowConnectionRequest } from '../xo/set-dataflow-connection-request.model';
import { XoStaticMethodInvocation } from '../xo/static-method-invocation.model';
import { XoTypeLabelArea } from '../xo/type-label-area.model';
import { XoUpdateXmomItemResponse } from '../xo/update-xmom-item-response.model';
import { XoVariableArea } from '../xo/variable-area.model';
import { XoWorkflowInvocation } from '../xo/workflow-invocation.model';
import { XoXmomItem } from '../xo/xmom-item.model';
import { XmomObjectType } from './xmom-types';
import { XoInsertRequestContent } from '@pmod/xo/insert-request-content.model';
import { XoModelledExpressionArray } from '@pmod/xo/expressions/modelled-expression.model';
import { XoItem } from '@pmod/xo/item.model';
import { XoGetModelledExpressionsResponse } from '@pmod/xo/expressions/get-modelled-expressions-response.model';


export enum ModellingActionType {
    change = 'change',
    complete = 'complete',
    convert = 'convert',
    copy = 'copy',
    copyToClipboard = 'copyToClipboard',
    decouple = 'complete',
    delete = 'delete',
    javaLibrary = 'javalib',
    pythonLibrary = 'pythonlib',
    deleteConstant = 'constant/delete',
    insert = 'insert',
    libraryCall = 'templateCall',
    move = 'move',
    refactor = 'refactor',
    replace = 'replace',
    setConstant = 'constant',
    sort = 'sort',
    split = 'split',
    swap = 'swap',
    toggle = 'toggle',
    type = 'type'
}


export interface ModellingAction extends TriggeredAction {
    xmomItem: XoXmomItem;
    rtc: RuntimeContext;
}


export interface XmomPath {
    path: string;
    label?: string;
    isAbsolute?: boolean;
    children?: XmomPath[];
}


export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}


export enum XmomState {
    SAVED = 'xmom',
    DEPLOYED = 'deployed'
}


// TODO: remove this interface as soon as backend sends Xo-objects for the factory items
interface FactoryItem {
    type: XmomObjectType;
    label: string;
    fqn: string;
    operation: string;
    rtc: any;
}



@Injectable()
export class XmomService {

    private readonly _clipboardSubject = new Subject<void>();

    private readonly _runtimeContextSubject = new BehaviorSubject<RuntimeContext>(null);
    private readonly _remoteDestinationsSubject = new BehaviorSubject<XoRemoteDestinationArray>(null);

    private readonly pendingXmomUrls = new Set<string>();


    constructor(private readonly http: HttpClient) {
    }


    private readonly beforeActionTriggeredSubject = new Subject<ModellingAction>();
    get beforeActionTriggered(): Observable<ModellingAction> {
        return this.beforeActionTriggeredSubject.asObservable();
    }

    private readonly afterActionTriggeredSubject = new Subject<ModellingAction>();
    get afterActionTriggered(): Observable<ModellingAction> {
        return this.afterActionTriggeredSubject.asObservable();
    }

    private readonly afterReceivedDataflowSubject = new Subject<XoXmomItem>();
    get afterReceivedDataflow(): Observable<XoXmomItem> {
        return this.afterReceivedDataflowSubject.asObservable();
    }


    private readonly itemSavedSubject = new Subject<XoUpdateXmomItemResponse>();

    get itemSaved(): Observable<XoUpdateXmomItemResponse> {
        return this.itemSavedSubject.asObservable();
    }


    private readonly itemDeployedSubject = new Subject<XoUpdateXmomItemResponse>();

    get itemDeployed(): Observable<XoUpdateXmomItemResponse> {
        return this.itemDeployedSubject.asObservable();
    }


    // =================================================================================================================
    // xmom
    // =================================================================================================================


    private getHttpParamsOption(paramSet: { [param: string]: string | string[] } = {}): { params: HttpParams } {
        Object.keys(paramSet)
            .filter(key => paramSet[key] == null)
            .forEach(key => delete paramSet[key]);
        return {
            params: new HttpParams({ fromObject: paramSet })
        };
    }


    private getXmomObjectUrl(rtc: RuntimeContext, fqn: FullQualifiedName, type: XmomObjectType, objectId?: string, action?: string, state: XmomState = XmomState.SAVED): string {
        objectId ??= fqn.anchor;
        const rtcPath = (!rtc || rtc === RuntimeContext.undefined ? this.runtimeContext : rtc).uniqueKey;
        const fqnPath = (!fqn || fqn === FullQualifiedName.undefined ? '' : '/' + fqn.path + '/' + fqn.name);
        const objectPath = (objectId ? '/objects/' + objectId : '');
        const actionPath = (action ? '/' + action : '');

        return 'runtimeContext/' + rtcPath + '/' + state.toString() + '/' + this.xmomTypeToPath(type) + fqnPath + objectPath + actionPath;
    }


    private urlFromAction(action: ModellingAction): { method: HttpMethod; url: string; options: { params: HttpParams }} {
        const url = this.getXmomObjectUrl(
            action.rtc,
            action.xmomItem.toFqn(),
            action.xmomItem.type,
            action.objectId,
            action.type
        );
        const options = this.getHttpParamsOption(action.paramSet);

        if (action.method) {
            return { method: action.method, url, options};
        }

        switch (action.type) {
            case ModellingActionType.change:
            case ModellingActionType.complete:
            case ModellingActionType.decouple:
            case ModellingActionType.libraryCall:
            case ModellingActionType.setConstant:
            case ModellingActionType.sort:
                return { method: HttpMethod.PUT, url, options };
            case ModellingActionType.move:
            case ModellingActionType.copy:
            case ModellingActionType.copyToClipboard:
            case ModellingActionType.type:
            case ModellingActionType.delete:
            case ModellingActionType.insert:
            case ModellingActionType.swap:
            case ModellingActionType.split:
            case ModellingActionType.toggle:
            case ModellingActionType.refactor:
            case ModellingActionType.replace:
            case ModellingActionType.deleteConstant:
            case ModellingActionType.convert:
                return { method: HttpMethod.POST, url, options };
        }
    }


    private xmomTypeToPath(type: XmomObjectType): string {
        switch (type) {
            case XmomObjectType.Workflow:
                return 'workflows';
            case XmomObjectType.DataType:
            case XmomObjectType.InstanceService:
                return 'datatypes';
            case XmomObjectType.ExceptionType:
                return 'exceptions';
            case XmomObjectType.ServiceGroup:
            case XmomObjectType.CodedService:
                return 'servicegroups';
        }
    }


    private xmomTypeToResponseType(type: XmomObjectType): XoClassInterface<XoGetXmomItemResponse> {
        switch (type) {
            case XmomObjectType.Workflow:
                return XoGetWorkflowResponse;
            case XmomObjectType.DataType:
            case XmomObjectType.InstanceService:
                return XoGetDataTypeResponse;
            case XmomObjectType.ExceptionType:
                return XoGetExceptionTypeResponse;
            case XmomObjectType.ServiceGroup:
            case XmomObjectType.CodedService:
                return XoGetServiceGroupResponse;
        }
    }


    /** @todo Remove this workaround. Backend shall return XoObjects, such that it doesn't have to be parsed here separately */
    private decodeToItem(object: FactoryItem): XoXmomItem {
        let result: XoXmomItem;
        const name = object.fqn.substring(object.fqn.lastIndexOf('.') + 1);
        const rtc = RuntimeContext.decode((<any>object).rtc);
        let xoRTC: XoRuntimeContext;
        if (rtc.av) {
            xoRTC = new XoApplication();
            (<XoApplication>xoRTC).name = rtc.av.application;
            (<XoApplication>xoRTC).version = rtc.av.version;
        } else if (rtc.ws) {
            xoRTC = new XoWorkspace();
            (<XoWorkspace>xoRTC).name = rtc.ws.workspace;
        }
        switch (object.type) {
            case XmomObjectType.Workflow: {
                const workflow = new XoWorkflowInvocation();
                result = workflow;
                workflow.operation = object.fqn;
                workflow.$fqn = object.fqn;
                workflow.label = object.label;
                workflow.typeLabelArea = new XoTypeLabelArea();
                workflow.typeLabelArea.text = workflow.label;
                workflow.typeLabelArea.$fqn = workflow.$fqn;
                workflow.inputArea = new XoVariableArea();
                workflow.outputArea = new XoVariableArea();
                workflow.$rtc = xoRTC;
                break;
            }
            case XmomObjectType.CodedService: {
                const staticMethod = new XoStaticMethodInvocation();
                result = staticMethod;
                staticMethod.service = name;
                staticMethod.operation = object.operation;
                staticMethod.$fqn = object.fqn;
                staticMethod.label = object.label;
                staticMethod.typeLabelArea = new XoTypeLabelArea();
                staticMethod.typeLabelArea.text = staticMethod.label;
                staticMethod.typeLabelArea.$fqn = staticMethod.$fqn;
                staticMethod.inputArea = new XoVariableArea();
                staticMethod.outputArea = new XoVariableArea();
                staticMethod.$rtc = xoRTC;
                break;
            }
            case XmomObjectType.InstanceService: {
                const dynamicMethod = new XoDynamicMethodInvocation();
                result = dynamicMethod;
                dynamicMethod.service = name;
                dynamicMethod.operation = object.operation;
                dynamicMethod.$fqn = object.fqn;
                dynamicMethod.label = object.label;
                dynamicMethod.typeLabelArea = new XoTypeLabelArea();
                dynamicMethod.typeLabelArea.text = dynamicMethod.label;
                dynamicMethod.typeLabelArea.$fqn = dynamicMethod.$fqn;
                dynamicMethod.inputArea = new XoVariableArea();
                dynamicMethod.outputArea = new XoVariableArea();
                dynamicMethod.$rtc = xoRTC;
                break;
            }
            case XmomObjectType.DataType: {
                const data = new XoData();
                result = data;
                data.$fqn = object.fqn;
                data.label = object.label;
                data.$rtc = xoRTC;
                /** data.isAbstract @todo */
                break;
            }
            case XmomObjectType.ExceptionType: {
                const exception = new XoException();
                result = exception;
                exception.$fqn = object.fqn;
                exception.label = object.label;
                exception.$rtc = xoRTC;
                /** exception.isAbstract @todo */
                break;
            }
            case XmomObjectType.ServiceGroup: {
                const serviceGroup = new XoServiceGroup();
                result = serviceGroup;
                serviceGroup.$fqn = object.fqn;
                serviceGroup.label = object.label;
                serviceGroup.$rtc = xoRTC;
                break;
            }
        }
        // Note that in this workaround every property on a XmomItem needs to be set in this function
        if ((object as any).ambigue) {
            result.ambigue = true;
        }
        if ((object as any).readonly) {
            result.readonly = true;
        }
        return result;
    }


    listXmomPaths(rtc: RuntimeContext, filterParam: string, hierarchyParam: 'full' | 'compact' | 'flat' | 'shallow'): Observable<XmomPath[]> {
        if (rtc && rtc !== RuntimeContext.undefined) {
            const url = 'runtimeContext/' + rtc.uniqueKey + '/xmom/paths';
            const params = { 'filter': filterParam, 'hierarchy': hierarchyParam };
            return this.http.get(url, this.getHttpParamsOption(params)).pipe(
                map((data: any) =>
                    data.paths
                )
            );
        }
        return of([]);
    }


    listXmomItems(rtc: RuntimeContext, path: string): Observable<XoXmomItem[]> {
        if (rtc && rtc !== RuntimeContext.undefined) {
            const url = 'runtimeContext/' + rtc.uniqueKey + '/xmom/objects/' + path;
            return this.http.get(url, this.getHttpParamsOption()).pipe(
                map((data: any) =>
                    data.objects.map((value: any) =>
                        this.decodeToItem(value)
                    )
                )
            );
        }
        return of([]);
    }


    findXmomItems(rtc: RuntimeContext, queryParam: string, maxCount?: number, filterCondition?: FilterConditionData): Observable<XoXmomItem[]> {
        if (rtc && rtc !== RuntimeContext.undefined) {
            const url = 'runtimeContext/' + rtc.uniqueKey + '/xmom/objects';
            const payload = filterCondition ?? (maxCount > 0 ? { maxCount } : {});
            const params = { q: queryParam };
            return this.http.post(url, payload, this.getHttpParamsOption(params)).pipe(
                map((data: any) =>
                    data.objects.map((value: any) =>
                        this.decodeToItem(value)
                    )
                )
            );
        }
        return of([]);
    }


    getXmomRelations(xmomItem: XoXmomItem): Observable<XoGetXmomRelationsResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'relations');
        return this.http.get(url, this.getHttpParamsOption()).pipe(
            map((data: any) => new XoGetXmomRelationsResponse().decode(data))
        );
    }


    getXmomIssues(xmomItem: XoXmomItem): Observable<XoGetIssuesResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'issues');
        return this.http.get(url, this.getHttpParamsOption()).pipe(
            map((data: any) => new XoGetIssuesResponse().decode(data))
        );
    }


    getXmomWarnings(xmomItem: XoXmomItem): Observable<XoGetWarningsResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'warnings');
        return this.http.get(url, this.getHttpParamsOption()).pipe(
            map((data: any) =>
                new XoGetWarningsResponse().decode(data)
            ),
            catchError(error => {
                console.error('error retrieving warnings', error);
                return of(new XoGetWarningsResponse());
            })
        );
    }


    checkXmomWarning(xmomItem: XoXmomItem, warningId: string): Observable<boolean> {
        const action: ModellingAction = {
            type: ModellingActionType.delete,
            request: new XoDeleteRequest(undefined, false),
            objectId: warningId,
            rtc: xmomItem.$rtc.runtimeContext(),
            xmomItem: xmomItem
        };
        return this.performModellingAction(action).pipe(
            map(_ => true),
            catchError(_ => of(false))
        );
    }


    performModellingAction(action: ModellingAction): Observable<XoUpdateXmomItemResponse> {
        const urlData = this.urlFromAction(action);
        const payload = action.request ? action.request.encode() : {};

        /**
         * @todo remove this as soon as XoRequest is accepted by the backend
         */
        const removeMeta = (object: any) => {
            if (object.$meta) {
                delete object.$meta;
            }
            for (const child in object) {
                if (object[child] && typeof object[child] === 'object') {
                    removeMeta(object[child]);
                }
            }
        };
        removeMeta(payload);

        let result: Observable<any>;
        switch (urlData?.method) {
            case HttpMethod.GET:
                result = this.http.get(urlData.url, urlData.options);
                break;
            case HttpMethod.POST:
                result = this.http.post(urlData.url, payload, urlData.options);
                break;
            case HttpMethod.PUT:
                result = this.http.put(urlData.url, payload, urlData.options);
                break;
            case HttpMethod.DELETE:
                result = this.http.delete(urlData.url, urlData.options);
                break;
            default:
                console.warn('XMOM Service: Did not start a request because no HTTP method was defined!');
                result = of({});
        }
        this.beforeActionTriggeredSubject.next(action);
        return result.pipe(
            map((data: any) =>
                new XoUpdateXmomItemResponse().decode(data)
            ),
            catchError(err => {
                if (err.error) {
                    err.error = new XoError().decode(err.error);
                }
                return throwError(err);
            }),
            finalize(() => {
                if (action.request.invalidatesClipboard(action.type, action.objectId)) {
                    this.invalidateClipboard();
                }
                this.afterActionTriggeredSubject.next(action);
            })
        );
    }


    newXmomWorkflowWithSignature(rtc: RuntimeContext, type: XmomObjectType, output: XoClassInterface<XoGetXmomItemResponse>, label: string, wfInput: XoInsertRequestContent[], wfOutput: XoInsertRequestContent[]) {

        const payload = { label: label, input: wfInput.map(value => value.encode()), output: wfOutput.map(value => value.encode()) };
        /**
         * @todo remove this as soon as XoRequest is accepted by the backend
         */
        const removeMeta = (object: any) => {
            if (object.$meta) {
                delete object.$meta;
            }
            for (const child in object) {
                if (object[child] && typeof object[child] === 'object') {
                    removeMeta(object[child]);
                }
            }
        };

        removeMeta(payload);
        return this.requestNewXmomObject(rtc, type, output, payload);
    }

    newXmomObject(rtc: RuntimeContext, type: XmomObjectType, output: XoClassInterface<XoGetXmomItemResponse>, label: string): Observable<XoGetXmomItemResponse> {
        const payload = { label: label };
        return this.requestNewXmomObject(rtc, type, output, payload);
    }


    private requestNewXmomObject(rtc: RuntimeContext, type: XmomObjectType, output: XoClassInterface<XoGetXmomItemResponse>, payload): Observable<XoGetXmomItemResponse> {
        const url = 'runtimeContext/' + rtc.uniqueKey + '/xmom/' + this.xmomTypeToPath(type);
        return this.http.post(url, payload).pipe(
            map((data: any) => (new output().decode(data)))
        );
    }


    loadXmomObject(rtc: RuntimeContext, fqn: FullQualifiedName, type: XmomObjectType, repair = false, state: XmomState = XmomState.SAVED): Observable<XoGetXmomItemResponse> {
        const url = this.getXmomObjectUrl(rtc, fqn, type, undefined, undefined, state);
        // remember, that url is now pending
        this.pendingXmomUrls.add(url);
        // fetch xmom object representation
        return this.http.get(url + (repair ? '?repair=true' : '')).pipe(
            // forget, that url is pending
            finalize(() => this.pendingXmomUrls.delete(url)),
            // decode json to corresponding xmom object
            map((data: XoJson) => new (this.xmomTypeToResponseType(type))().decode(data))
        );
    }


    unlockXmomObject(xmomItem: XoXmomItem): Observable<XoUnlockResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'unlock');
        const payload = {};
        // unlock xmom object
        return this.http.post(url, payload).pipe(
            // decode json to corresponding response
            map((data: any) => new XoUnlockResponse().decode(data))
        );
    }


    closeXmomObject(xmomItem: XoXmomItem, revision: number, force = false): Observable<XoCloseResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'close');
        const payload = { force, revision };
        // remember, that url is now pending
        this.pendingXmomUrls.add(url);
        // close xmom object
        return this.http.post(url, payload).pipe(
            // forget, that url is pending
            finalize(() => this.pendingXmomUrls.delete(url)),
            // decode json to corresponding response
            map((data: any) => new XoCloseResponse().decode(data))
        );
    }


    saveXmomObject(xmomItem: XoXmomItem, revision: number, label?: string, path?: string, force = false, forceEmptyLabelAndPath = false): Observable<XoUpdateXmomItemResponse> {
        // TODO: Will use 'PUT: ...' in the future
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'save');
        const payload = forceEmptyLabelAndPath
            ? { force, revision }
            : {
                force, revision,
                path: path || xmomItem.toFqn().path,
                label: label || xmomItem.label
            };

        let response: XoUpdateXmomItemResponse;
        return this.http.post(url, payload).pipe(
            map((data: any) =>
                response = new XoUpdateXmomItemResponse().decode(data)
            ),
            finalize(() => {
                this.itemSavedSubject.next(response);
            })
        );
    }


    deployXmomObject(xmomItem: XoXmomItem, revision: number): Observable<XoUpdateXmomItemResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'deploy');
        const payload = { revision };

        let response: XoUpdateXmomItemResponse;
        return this.http.post(url, payload).pipe(
            map((data: any) => response = new XoUpdateXmomItemResponse().decode(data)),
            catchError(err => {
                if (err.error) {
                    err.error = new XoError().decode(err.error);
                }
                return throwError(err);
            }),
            finalize(() => {
                this.itemDeployedSubject.next(response);
            })
        );
    }


    getDataflow(xmomItem: XoXmomItem, state: XmomState = XmomState.SAVED): Observable<XoGetDataflowResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'dataflow', state);
        return this.http.get(url).pipe(
            map((data: any) => new XoGetDataflowResponse().decode(data)),
            finalize(() => this.afterReceivedDataflowSubject.next(xmomItem))
        );
    }


    setDataflowConnection(xmomItem: XoXmomItem, request: XoSetDataflowConnectionRequest): Observable<XoGetDataflowResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'dataflow');
        const payload = request.encode();

        /**
         * @todo remove this as soon as XoRequest is accepted by the backend
         */
        delete payload.$meta;
        if ((<any>payload).content) {
            delete (<any>payload).content.$meta;
        }

        return this.http.put(url, payload).pipe(
            map((data: any) => new XoGetDataflowResponse().decode(data))
        );
    }


    getOrderInputSources(xmomItem: XoXmomItem): Observable<XoOrderInputSourceArray> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'orderinputsources');
        return this.http.get(url).pipe(
            map((data: any) => new XoGetOrderInputSourcesResponse().decode(data).orderInputSources)
        );
    }


    getModelledExpressions(xmomItem: XoXmomItem, step: XoItem): Observable<XoModelledExpressionArray> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, step.id, 'modelledExpressions');
        return this.http.get(url).pipe(
            map((data: any) => new XoGetModelledExpressionsResponse().decode(data).modelledExpressions)
        );
    }


    undo(xmomItem: XoXmomItem): Observable<XoGetXmomItemResponse> {
        const url = this.getXmomObjectUrl(undefined, xmomItem.toFqn(), xmomItem.type, undefined, 'undo');
        return this.http.get(url).pipe(
            map((data: any) => new XoGetXmomItemResponse().decode(data))
        );
    }


    redo(xmomItem: XoXmomItem): Observable<XoGetXmomItemResponse> {
        const url = this.getXmomObjectUrl(undefined, xmomItem.toFqn(), xmomItem.type, undefined, 'redo');
        return this.http.get(url).pipe(
            map((data: any) => new XoGetXmomItemResponse().decode(data))
        );
    }


    getXML(xmomItem: XoXmomItem): Observable<XoGetXMLResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, undefined, 'xml');
        return this.http.get(url).pipe(
            map((data: any) => new XoGetXMLResponse().decode(data))
        );
    }


    isPendingXmomObject(rtc: RuntimeContext, fqn: FullQualifiedName, type: XmomObjectType): boolean {
        return this.pendingXmomUrls.has(this.getXmomObjectUrl(rtc, fqn, type));
    }


    isPendingAny(): boolean {
        return this.pendingXmomUrls.size > 0;
    }


    get runtimeContextChange(): Observable<RuntimeContext> {
        return this._runtimeContextSubject.asObservable();
    }


    get runtimeContext(): RuntimeContext {
        return this._runtimeContextSubject.getValue();
    }


    set runtimeContext(value: RuntimeContext) {
        this._runtimeContextSubject.next(value);
    }


    // ===================================================================================================================
    // Clipboard
    // ===================================================================================================================


    invalidateClipboard() {
        this._clipboardSubject.next();
    }


    get clipboardChange(): Observable<void> {
        return this._clipboardSubject.asObservable();
    }


    getClipboard(): Observable<XoGetClipboardResponse> {
        const url = 'clipboard';
        return this.http.get(url).pipe(
            map((data: any) => new XoGetClipboardResponse().decode(data))
        );
    }


    clearClipboard(): Observable<XoGetClipboardResponse> {
        const url = 'clipboard/clear';
        return this.http.put(url, {}).pipe(
            map((data: any) => new XoGetClipboardResponse().decode(data))
        );
    }


    // ===================================================================================================================
    // Copy & Save
    // ===================================================================================================================


    getXmomObjectXML(xmomItem: XoXmomItem, objectId: string): Observable<XoGetObjectXMLResponse> {
        const url = this.getXmomObjectUrl(xmomItem.toRtc(), xmomItem.toFqn(), xmomItem.type, objectId, 'xml');
        return this.http.get(url).pipe(
            catchError(err => {
                if (err.error) {
                    err.error = new XoError().decode(err.error);
                }
                return throwError(err);
            }),
            map((data: any) => new XoGetObjectXMLResponse().decode(data))
        );
    }


    // ===================================================================================================================
    // Remote Destinations
    // ===================================================================================================================


    getRemoteDestinations(): Observable<XoRemoteDestinationArray> {
        if (this._remoteDestinationsSubject.getValue()) {
            return this._remoteDestinationsSubject.asObservable();
        }

        const url = 'remoteDestinations';
        return this.http.get(url).pipe(
            map((data: any) => {
                const response = new XoGetRemoteDestinationResponse().decode(data);
                this._remoteDestinationsSubject.next(response.remoteDestinations);
                return response.remoteDestinations;
            })
        );
    }
}
