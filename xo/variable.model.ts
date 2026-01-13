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
import { FullQualifiedName, Xo, XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { ConnectionTypeSeverity, DataConnectionType, XoConnection } from './connection.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertVariableRequestContent } from './insert-variable-request-content.model';
import { XoModellingItem } from './modelling-item.model';
import { XoReferableObject } from './referable-object.model';
import { XoXmomItem } from './xmom-item.model';


@XoObjectClass(XoXmomItem, 'xmcp.processmodeller.datatypes', 'Variable')
export class XoVariable extends XoXmomItem {

    @XoProperty()
    isList = false;

    /**
     * Name is set in context of an Operation Signature of a Service Group or Data Type
     */
    @XoProperty()
    name: string;

    @XoProperty()
    @XoTransient()
    showName = false;

    @XoProperty()
    @XoTransient()
    referred = false;

    @XoProperty()
    castToFqn: string;

    @XoProperty()
    allowCast: boolean;

    @XoProperty()
    allowConst: 'ALWAYS' | 'FOR_BRANCHES' | 'NEVER';

    /**
     * Branches which assign this variable as their output
     */
    @XoProperty()
    @XoTransient()
    providingBranches: XoModellingItem[] = [];

    /**
     * incoming dataflow-connections
     */
    @XoProperty()
    @XoTransient()
    inConnections: XoConnection[] = [];


    toFqn(): FullQualifiedName {
        return this.castToFqn
            ? FullQualifiedName.decode(this.castToFqn)
            : super.toFqn();
    }


    getConstant(branchId?: string): Xo {
        const connection = this.inConnections.find(c =>
            (c.branchId === branchId) && (c.type === DataConnectionType.constant)
        );
        if (connection) {
            return connection.constantObject;
        }
    }


    /**
     * Returns
     *   - DataConnectionType.none for no connections
     *   - most erroneous link state over all connections (matching branchId) otherwise
     */
    getLinkStateIn(branchId?: string): string {
        let type: DataConnectionType;
        this.inConnections
            .filter (c => (!branchId || c.branchId === branchId))
            .forEach(c => {
                if (ConnectionTypeSeverity(c.type) > ConnectionTypeSeverity(type)) {
                    type = c.type;
                }
            });
        return type || DataConnectionType.auto;
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertVariableRequestContent();
        content.label = this.label;
        content.$fqn = this.$fqn;
        content.isList = this.isList;
        content.isAbstract = this.isAbstract;
        return content;
    }


    getVariables(): XoReferableObject[] {
        return [...super.getVariables(), this];
    }
}


@XoArrayClass(XoVariable)
export class XoVariableArray<T extends XoVariable> extends XoArray<T> {
}
