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

import { XoContentArea } from './content-area.model';
import { XoModellingItem } from './modelling-item.model';
import { XoVariableArea } from './variable-area.model';


@XoObjectClass(XoModellingItem, 'xmcp.processmodeller.datatypes', 'Foreach')
export class XoForeach extends XoModellingItem {

    @XoProperty(XoVariableArea)
    @XoTransient()
    inputArea: XoVariableArea;

    @XoProperty(XoContentArea)
    @XoTransient()
    contentArea: XoContentArea;

    @XoProperty(XoVariableArea)
    @XoTransient()
    outputArea: XoVariableArea;

    @XoProperty()
    parallelExecution = false;


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoModellingItem.INPUT_AREA_NAME) {
                this.inputArea = area as XoVariableArea;
            } else if (area.name === XoModellingItem.CONTENT_AREA_NAME) {
                this.contentArea = area as XoContentArea;
            } else if (area.name === XoModellingItem.OUTPUT_AREA_NAME) {
                this.outputArea = area as XoVariableArea;
            }
        }
    }


    get isNestedForeach(): boolean {
        return !!this.wrappingForeach;
    }


    get wrappingForeach(): XoForeach {
        const container = this.parent as XoContentArea;
        if (container && container.parent instanceof XoForeach) {
            return container.parent;
        }
        return null;
    }


    // get nestedForeach(): XoForeach {
    //     return this.contentArea && this.contentArea.items.length > 0 && this.contentArea.items.data[0] instanceof XoForeach
    //         ? this.contentArea.items.data[0] as XoForeach
    //         : null;
    // }


    get isMergedForeach(): boolean {
        return this.inputArea && this.inputArea.items.length > 1;
    }
}


@XoArrayClass(XoForeach)
export class XoForeachArray extends XoArray<XoForeach> {
}
