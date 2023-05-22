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
import { RuntimeContext, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';

import { XoFilterCriterion } from './filter-criterion.model';
import { XoFormulaArea } from './formula-area.model';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertServiceRequestContent } from './insert-service-request-content.model';
import { XoInvocation } from './invocation.model';
import { XoLabelArea } from './label-area.model';
import { XoModellingItem } from './modelling-item.model';
import { XoSelectionMaskCriterion } from './selection-mask-criterion.model';
import { XoSortingCriterion } from './sorting-criterion.model';
import { XoVariableArea } from './variable-area.model';


@XoObjectClass(XoInvocation, 'xmcp.processmodeller.datatypes', 'Query')
export class XoQuery extends XoInvocation {

    static readonly FILTER_AREA_NAME = 'filterCriteria';
    static readonly SELECTION_MASK_AREA_NAME = 'selectionMasks';
    static readonly SORTING_AREA_NAME = 'sortings';

    @XoProperty(XoFormulaArea)
    @XoTransient()
    filterArea: XoFormulaArea;

    @XoProperty(XoFormulaArea)
    @XoTransient()
    selectionMaskArea: XoFormulaArea;

    @XoProperty(XoFormulaArea)
    @XoTransient()
    sortingArea: XoFormulaArea;

    @XoProperty(XoLabelArea)
    @XoTransient()
    labelArea: XoLabelArea;

    @XoProperty()
    limit = 0;

    @XoProperty()
    queryHistory = false;


    constructor(_ident?: string) {
        super(_ident);

        // instantiate specific member models such that they aren't pruned for the release build
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const f = new XoFilterCriterion();
        const s = new XoSortingCriterion();
        const m = new XoSelectionMaskCriterion();
        /* eslint-enable @typescript-eslint/no-unused-vars */
    }


    afterDecode() {
        super.afterDecode();

        for (const area of this.areas) {
            if (area.name === XoQuery.FILTER_AREA_NAME) {
                this.filterArea = area as XoFormulaArea;
            } else if (area.name === XoQuery.SELECTION_MASK_AREA_NAME) {
                this.selectionMaskArea = area as XoFormulaArea;
            }  else if (area.name === XoQuery.SORTING_AREA_NAME) {
                this.sortingArea = area as XoFormulaArea;
            } else if (area.name === XoModellingItem.LABEL_AREA_NAME) {
                this.labelArea = area as XoLabelArea;
            }
        }
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertServiceRequestContent();
        content.type = 'query';
        content.label = this.labelArea && this.labelArea.text ? this.labelArea.text : 'Query';
        return content;
    }


    static query(withLabel?: string): XoQuery {
        const result = new XoQuery();
        result.rtc = RuntimeContext.fromWorkspace('');
        result.outputArea = new XoVariableArea();
        result.filterArea = new XoFormulaArea();
        result.selectionMaskArea = new XoFormulaArea();
        result.sortingArea = new XoFormulaArea();
        result.labelArea = new XoLabelArea();
        result.labelArea.text = withLabel ? withLabel : 'Query';
        return result;
    }
}
