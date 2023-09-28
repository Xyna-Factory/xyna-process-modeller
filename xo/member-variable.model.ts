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
import { XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoInsertMemberVariableRequestContent } from './insert-member-variable-request-content.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoModellingItem } from './modelling-item.model';
import { HasStorablePropertyArea, XoStorablePropertyArea } from './storable-property-area.model';
import { XoTextArea } from './text-area.model';
import { XoXmomItem } from './xmom-item.model';


@XoObjectClass(XoXmomItem, 'xmcp.processmodeller.datatypes.datatypemodeller', 'MemberVariable')
export class XoMemberVariable extends XoXmomItem implements HasStorablePropertyArea {

    static readonly STORABLE_PROPERTY_AREA_NAME = 'storableProperties';

    @XoProperty()
    name: string;

    @XoProperty()
    storableRole: string;

    @XoProperty()
    primitiveType: string;

    @XoProperty()
    isList: boolean;

    @XoProperty()
    documentation: string;

    @XoProperty()
    @XoTransient()
    documentationArea: XoTextArea;

    @XoProperty()
    @XoTransient()
    storablePropertyArea: XoStorablePropertyArea;


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertMemberVariableRequestContent();
        content.label = this.label || 'Data';
        content.isList = this.isList;
        return content;
    }


    protected afterDecode() {
        // to make sure that needed values are not undefined but strings instead.
        this.$fqn = this.$fqn || '';
        this.primitiveType = this.primitiveType || '';

        for (const area of this.areas) {
            switch (area.name) {
                case XoModellingItem.DOCUMENTATION_AREA_NAME: this.documentationArea = area as XoTextArea; break;
                case XoMemberVariable.STORABLE_PROPERTY_AREA_NAME:
                    this.storablePropertyArea = area as XoStorablePropertyArea;
                    this.storablePropertyArea.label = this.label;
                    break;
            }
        }
    }
}


@XoArrayClass(XoMemberVariable)
export class XoMemberVariableArray extends XoArray<XoMemberVariable> {
}
