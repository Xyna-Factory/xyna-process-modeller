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
import { ApiService, OrderTypeSignature, RuntimeContext } from '@zeta/api';

import { concat, Observable, of, Subject } from 'rxjs/';
import { map } from 'rxjs/operators';

import { XmomObjectType } from '../../api/xmom-types';
import { DocumentService } from '../../document/document.service';
import { XoXmomItem } from '../../xo/xmom-item.model';


export class WorkflowConstantBuilder {

    static readonly maxCount = 50000;

    static build(
        documentService: DocumentService,
        apiService: ApiService,
        rtc: RuntimeContext = RuntimeContext.defaultWorkspace,
        preselectedXmomPaths: string[] = [],
        constName = 'WFs',
        withWorkflowSignature = true
    ): Observable<string> {

        const subj = new Subject<string>();

        const tree = {};

        this.makeRequests(documentService, rtc, preselectedXmomPaths).subscribe(items => {
            // console.log('#', items.map<string>(i => i.$fqn));
            items.forEach(item => {
                const parts = item.$fqn.split('.');
                let branch = tree;
                parts.forEach((part, i) => {
                    if (i < parts.length - 1) {
                        branch[part] = branch[part] ? branch[part] : {};
                        branch = branch[part];
                    } else {
                        branch[part] = item.$fqn;
                    }
                });
            });

            // transform tree to typescript const
            let object = this.transformTreeToTypeScriptObject(tree, withWorkflowSignature);

            if (withWorkflowSignature) {

                this.makeSignatureRequests(apiService, rtc, items).subscribe(
                    keyValuePairs => {
                        keyValuePairs.forEach(pair => {
                            object = object.replace(pair.key, pair.value);
                        });
                        const CONST = 'export const ' + constName +  ' = ' + object + ';';
                        subj.next(CONST);
                        subj.complete();
                    },
                    error => {
                        subj.error(error);
                        subj.complete();
                    }
                );

            } else {
                const CONST = 'export const ' + constName +  ' = ' + object + ';';
                subj.next(CONST);
                subj.complete();
            }
        },
        error => {
            subj.error(error);
            subj.complete();
        });

        return subj.asObservable();
    }

    private static makeRequests(documentService: DocumentService, rtc: RuntimeContext, prePaths: string[]): Observable<XoXmomItem[]> {
        const subj = new Subject<XoXmomItem[]>();
        const allowedItems: XoXmomItem[] = [];
        let i: number;

        const allowed = (path: string, allowedPrefixes: string[]): boolean => {
            if (!allowedPrefixes && allowedPrefixes.length === 0) {
                return true;
            }
            for (const pre of allowedPrefixes) {
                if (path.startsWith(pre)) {
                    return true;
                }
            }
            return false;
        };

        const responses: Observable<XoXmomItem[]>[] = [];
        let res: (Observable<XoXmomItem[]>);

        if (prePaths.length) {
            for (i = 0; i < prePaths.length; i++) {
                res = documentService.xmomService.findXmomItems(rtc, prePaths[i], this.maxCount);
                responses.push(res);
            }
        } else {
            res = documentService.xmomService.findXmomItems(rtc, '*', this.maxCount);
            responses.push(res);
        }

        concat(...responses).subscribe(
            items => {
                items.forEach(item => {
                    if (item.type === XmomObjectType.Workflow && allowed(item.$fqn, prePaths)) {
                        allowedItems.push(item);
                    }
                });
            },
            err => {
                subj.error(err);
                subj.complete();
            },
            () => {
                subj.next(allowedItems);
                subj.complete();
            }
        );

        return subj.asObservable();
    }

    private static transformTreeToTypeScriptObject(tree: object, withWorkflowSignature: boolean) {
        // indent fn
        const it = (depth: number, num = 4, char = ' ') => {
            let i: number;
            let indent = '';
            for (i = 0; i < depth * num; i++) {
                indent += char;
            }
            return indent;
        };

        const getBranch = (branch: object, d: number): string => {
            let str = '{\n';
            const keys = Object.keys(branch);
            keys.forEach((br, ind) => {
                if (typeof branch[br] === 'string') {
                    if (withWorkflowSignature) {
                        str += it(d + 1) + '/**\n';
                        str += it(d + 1) + ' * ' + this.createRegExStampByFQN(branch[br]) + '\n';
                        str += it(d + 1) + ' */\n';
                    }
                    str += it(d + 1) + br + ': \'' + branch[br] + (ind + 1 === keys.length ? '\'\n' : '\',\n');
                } else {
                    str += it(d + 1) + br + ': ' + getBranch(branch[br], d + 1) + (ind + 1 === keys.length ? '\n' : ',\n');
                }
            });
            return str + it(d) + (d ? '}' : '}');
        };

        return getBranch(tree, 0);
    }

    private static makeSignatureRequests(apiService: ApiService, rtc: RuntimeContext, items: XoXmomItem[]): Observable<({key: string; value: string})[]> {

        const subj = new Subject<({key: string; value: string})[]>();

        const response: ({key: string; value: string})[] = [];

        const singleRequest = (innerRtc: RuntimeContext, innerOrderType: string): Observable<ReferingSignature> =>
            apiService.getSignature(innerRtc, innerOrderType).pipe<ReferingSignature>(
                map((sig: OrderTypeSignature) => <ReferingSignature>{...sig, ordertype: innerOrderType})
            );

        let num = 0;
        const recursiveRequests = () => {
            singleRequest(rtc, items[num].$fqn).subscribe(
                sig => {
                    const inputs = sig.inputs.map<string>(input => input.fqn.name);
                    const outputs = sig.outputs.map<string>(output => output.fqn.name);
                    const value = 'INPUTS [' + inputs.join(', ') + '] OUTPUTS [' + outputs.join(', ') + ']';
                    response.push({key: this.createRegExStampByFQN(sig.ordertype), value});
                    num++;
                    if (num >= items.length) {
                        // subject next and complete
                        subj.next(response);
                        subj.complete();
                    } else {
                        // recursion
                        recursiveRequests();
                    }
                },
                error => {
                    subj.error(error);
                    subj.complete();
                }
            );
        };

        if (items.length) {
            recursiveRequests();
            return subj.asObservable();
        }
        return of([]);
    }

    static createRegExStampByFQN(fqn: string): string {
        return '%FQN%' + fqn + '%';
    }

}

interface ReferingSignature extends OrderTypeSignature {
    ordertype: string;
}
