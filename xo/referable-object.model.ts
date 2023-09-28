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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes', 'ReferableObject')
export class XoReferableObject extends XoObject {

    static instanceCounter = 0;

    @XoProperty()
    id: string;

    @XoProperty()
    readonly: boolean;

    @XoProperty()
    @XoTransient()
    parent: XoReferableObject;


    constructor(_ident?: string) {
        _ident = 'referableObject_num_' + ++XoReferableObject.instanceCounter;
        super(_ident);
    }


    get root(): XoReferableObject {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let result: XoReferableObject = this;
        while (result.parent) {
            result = result.parent;
        }
        return result;
    }


    protected afterDecode() {
        super.afterDecode();

        // generically add this object as parent to all of its children
        const addParent = (item: any) => {
            if (item instanceof XoReferableObject) {
                item.parent = this;
                return true;
            }
            return false;
        };
        Object.keys(this.data)
            // don't touch parent of transient and null/undefined data
            .filter(key => !this.transientProperties.has(key) && this.data[key] != null)
            .forEach(key => {
                if (!addParent(this.data[key])) {
                    if (this.data[key] instanceof Array || this.data[key] instanceof XoArray) {
                        for (const entry of this.data[key]) {
                            addParent(entry);
                        }
                    }
                }
            });
    }


    /**
     * Returns all variables used inside of this object
     */
    getVariables(): XoReferableObject[] {
        return [];
    }
}


@XoArrayClass(XoReferableObject)
export class XoReferableObjectArray extends XoArray<XoReferableObject> {
}
