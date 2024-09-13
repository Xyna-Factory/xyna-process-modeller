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

import { XoModellingItem } from './modelling-item.model';
import { XoTextArea } from './text-area.model';
import { XoVariableArea } from './variable-area.model';
import { XoXmomItem } from './xmom-item.model';
import { XoMetaTagArea } from './meta-tag-area.model';


@XoObjectClass(XoXmomItem, 'xmcp.processmodeller.datatypes.datatypemodeller', 'Method')
export class XoMethod extends XoXmomItem {

    static readonly IMPL_TYPE_ABSTRACT = 'abstract';
    static readonly IMPL_TYPE_CODED_SERVICE = 'codedService';
    static readonly IMPL_TYPE_CODED_SERVICE_PYTHON = 'codedServicePython';
    static readonly IMPL_TYPE_REFERENCE = 'reference';

    static readonly THROWS_AREA = 'throws';

    @XoProperty()
    name: string;

    @XoProperty()
    implementationType: string;

    @XoProperty()
    @XoTransient()
    readonlyImplementation: boolean;

    @XoProperty()
    isAbortable: boolean;

    @XoProperty()
    isLabelReadonly: boolean;

    @XoProperty()
    @XoTransient()
    documentationArea: XoTextArea;

    @XoProperty()
    @XoTransient()
    implementationArea: XoTextArea;

    // set true in the DataType Model
    @XoProperty()
    // @XoTransient() - TODO: Transient decorated data is lost in the drag&drop process because it uses Xo.encode() in setDraggedItem()
    isInheritedInstanceMethod = false;

    @XoProperty()
    @XoTransient()
    inputArea: XoVariableArea;

    @XoProperty()
    @XoTransient()
    outputArea: XoVariableArea;

    @XoProperty()
    @XoTransient()
    throwsArea: XoVariableArea;

    @XoProperty()
    @XoTransient()
    metaTagArea: XoMetaTagArea;


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            switch (area.name) {
                case XoModellingItem.DOCUMENTATION_AREA_NAME: this.documentationArea = area as XoTextArea; break;
                case XoModellingItem.IMPLEMENTATION_AREA_NAME: this.implementationArea = area as XoTextArea; break;
                case XoMethod.INPUT_AREA_NAME: this.inputArea = area as XoVariableArea; break;
                case XoMethod.OUTPUT_AREA_NAME: this.outputArea = area as XoVariableArea; break;
                case XoMethod.THROWS_AREA: this.throwsArea = area as XoVariableArea; break;
                case XoMethod.META_TAG_AREA_NAME: this.metaTagArea = area as XoMetaTagArea; break;
            }
        }

        if (!this.readonlyImplementation && this.implementationType !== XoMethod.IMPL_TYPE_CODED_SERVICE && this.implementationType !== XoMethod.IMPL_TYPE_CODED_SERVICE_PYTHON) {
            this.readonlyImplementation = true;
        }

        if (!!this.inputArea && !!this.inputArea.variables) {
            this.inputArea.variables.forEach(variable => variable.showName = true);
        }
    }
}


@XoArrayClass(XoMethod)
export class XoMethodArray extends XoArray<XoMethod> {
}
