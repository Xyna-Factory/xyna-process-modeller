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
import { FullQualifiedName, RuntimeContext, XoArray, XoArrayClass, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';
import { encodeURIComponentRFC1738 } from '@zeta/base';

import { XmomObjectType } from '../api/xmom-types';
import { XoModellingItem } from './modelling-item.model';
import { XoRuntimeContext } from './runtime-context.model';


@XoObjectClass(XoModellingItem, 'xmcp.processmodeller.datatypes', 'XMOMItem')
export class XoXmomItem extends XoModellingItem {

    static readonly INHERITED_VARS_AREA = 'inheritedVars';
    static readonly MEMBER_VARS_AREA = 'memberVars';
    static readonly LIBS_AREA = 'libs';
    static readonly SHARED_LIBS_AREA = 'sharedLibs';

    @XoProperty(XoRuntimeContext)
    $rtc: XoRuntimeContext;

    @XoProperty()
    $fqn: string;

    @XoProperty()
    @XoTransient()
    type: XmomObjectType;

    @XoProperty()
    isAbstract: boolean;

    @XoProperty()
    ambigue: boolean;


    /**
     * Returns RTC of this XMOM item or - if null - of nearest parent with set RTC
     * FIXME Smelling code. Maybe the API should *always* return an RTC for an XMOM item
     */
    get evaluatedRtc(): XoRuntimeContext {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let item: XoXmomItem = this;
        while (item && !item.$rtc) {
            item = item.xmomParent;
        }
        return item ? item.$rtc : null;
    }


    get xmomParent(): XoXmomItem {
        let xmomItem = this.parent;
        while (xmomItem && !(xmomItem instanceof XoXmomItem)) {
            xmomItem = xmomItem.parent;
        }
        return xmomItem as XoXmomItem;
    }


    toRtc(): RuntimeContext {
        return this.$rtc
            ? this.$rtc.runtimeContext()
            : RuntimeContext.undefined;
    }


    toFqn(): FullQualifiedName {
        return this.$fqn
            ? FullQualifiedName.decode(this.$fqn)
            : FullQualifiedName.undefined;
    }


    toQueryValue(): string {
        const rtc = this.$rtc.toQueryParam();
        const fqn = this.$fqn;
        const type = this.type;
        return encodeURIComponentRFC1738(JSON.stringify({rtc, fqn, type}));
    }
}


@XoArrayClass(XoXmomItem)
export class XoXmomItemArray extends XoArray<XoXmomItem> {
}
