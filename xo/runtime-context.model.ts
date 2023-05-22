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
import { ApplicationVersion, RuntimeContext, Workspace, XoObject, XoObjectClass, XoProperty } from '@zeta/api';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes', 'RuntimeContext')
export class XoRuntimeContext extends XoObject {

    runtimeContext(): RuntimeContext {
        return null;
    }

    toQueryParam(): string {
        return null;
    }

    static fromQueryParam(param: string): XoRuntimeContext {
        /* eslint-disable @typescript-eslint/no-use-before-define */
        return XoApplication.isApplicationQueryParam(param)
            ? XoApplication.fromQueryParam(param)
            : XoWorkspace.fromQueryParam(param);
        /* eslint-enable @typescript-eslint/no-use-before-define */
    }

    static fromRuntimeContext(rtc: RuntimeContext): XoRuntimeContext {
        /* eslint-disable @typescript-eslint/no-use-before-define */
        if (rtc.ws) {
            return XoWorkspace.fromWorkspace(rtc.ws);
        }
        if (rtc.av) {
            return XoApplication.fromApplication(rtc.av);
        }
        /* eslint-enable @typescript-eslint/no-use-before-define */
        return null;
    }
}


@XoObjectClass(XoRuntimeContext, 'xmcp.processmodeller.datatypes', 'Workspace')
export class XoWorkspace extends XoRuntimeContext {

    @XoProperty()
    name: string;

    runtimeContext(): RuntimeContext {
        return RuntimeContext.fromWorkspace(this.name);
    }

    toQueryParam(): string {
        return this.name;
    }

    static fromQueryParam(param: string): XoWorkspace {
        const w = new XoWorkspace();
        w.name = param;
        return w;
    }

    static fromWorkspace(ws: Workspace) {
        const result = new XoWorkspace();
        result.name = ws.workspace;
        return result;
    }
}


@XoObjectClass(XoRuntimeContext, 'xmcp.processmodeller.datatypes', 'Application')
export class XoApplication extends XoRuntimeContext {

    @XoProperty()
    name: string;

    @XoProperty()
    version: string;

    runtimeContext(): RuntimeContext {
        return RuntimeContext.fromApplicationVersion(this.name, this.version);
    }

    toQueryParam(): string {
        return this.name + '~' + this.version;
    }

    static isApplicationQueryParam(param: string): boolean {
        return param.indexOf('~') >= 0;
    }

    static fromQueryParam(param: string): XoApplication {
        const arr = param.split('~');
        const app = new XoApplication();
        app.name = arr[0];
        app.version = arr[1];
        return app;
    }

    static fromApplication(av: ApplicationVersion) {
        const result = new XoApplication();
        result.name = av.application;
        result.version = av.version;
        return result;
    }
}
