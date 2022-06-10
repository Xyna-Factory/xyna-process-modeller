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
import { XoArray, XoArrayClass, XoObjectClass } from '@zeta/api';

import { XmomObjectType } from '../api/xmom-types';
import { XoInsertRequestContent } from './insert-request-content.model';
import { XoInsertServiceRequestContent } from './insert-service-request-content.model';
import { XoInvocation } from './invocation.model';
import { XoVariableArea } from './variable-area.model';


@XoObjectClass(XoInvocation, 'xmcp.processmodeller.datatypes.invocation', 'WorkflowInvocation')
export class XoWorkflowInvocation extends XoInvocation {

    constructor(_ident?: string) {
        super(_ident);
        this.type = XmomObjectType.Workflow;
        this.allowsOrderInputSource = true;
    }


    createInsertRequestContent(): XoInsertRequestContent {
        const content = new XoInsertServiceRequestContent();
        content.label = this.label;
        content.$fqn = this.$fqn;
        content.operation = this.operation;
        return content;
    }


    static store(): XoWorkflowInvocation {
        const inv = new XoWorkflowInvocation();
        inv.inputArea = new XoVariableArea();
        inv.label = 'Store';
        inv.$fqn = 'xnwh.persistence.Store';
        inv.operation = 'xnwh.persistence.Store';
        return inv;
    }


    static delete(): XoWorkflowInvocation {
        const inv = new XoWorkflowInvocation();
        inv.inputArea = new XoVariableArea();
        inv.label = 'Delete';
        inv.$fqn = 'xnwh.persistence.Delete';
        inv.operation = 'xnwh.persistence.Delete';
        return inv;
    }


    // not a workflow invocation - but works for now: TODO: - move it
    static wait(): XoWorkflowInvocation {
        const inv = new XoWorkflowInvocation();
        inv.inputArea = new XoVariableArea();
        inv.label = 'Wait';
        inv.$fqn = 'xprc.waitsuspend.WaitAndSuspendFeature';
        inv.operation = 'wait';
        return inv;
    }


    // not a workflow invocation - but works for now: TODO: - move it
    static await(): XoWorkflowInvocation {
        const inv = new XoWorkflowInvocation();
        inv.inputArea = new XoVariableArea();
        inv.outputArea = new XoVariableArea();
        inv.label = 'Await';
        inv.$fqn = 'xprc.synchronization.Synchronization';
        inv.operation = 'awaitNotification';
        return inv;
    }


    // not a workflow invocation - but works for now: TODO: - move it
    static notify(): XoWorkflowInvocation {
        const inv = new XoWorkflowInvocation();
        inv.inputArea = new XoVariableArea();
        inv.label = 'Notify';
        inv.$fqn = 'xprc.synchronization.Synchronization';
        inv.operation = 'notifyWaitingOrder';
        return inv;
    }


    // not a workflow invocation - but works for now: TODO: - move it
    static manualInteraction(): XoWorkflowInvocation {
        const inv = new XoWorkflowInvocation();
        inv.inputArea = new XoVariableArea();
        inv.label = 'Wait For MI';
        inv.$fqn = 'xmcp.manualinteraction.MIService';
        inv.operation = 'WaitForMI';
        return inv;
    }


    // not a workflow invocation - but works for now: TODO: - move it
    static beginDocument(): XoWorkflowInvocation {
        const inv = new XoWorkflowInvocation();
        inv.inputArea = new XoVariableArea();
        inv.label = 'Begin document';
        inv.$fqn = 'xact.templates.TemplateManagement';
        inv.operation = 'start';
        return inv;
    }


    // not a workflow invocation - but works for now: TODO: - move it
    static retrieveDocument(): XoWorkflowInvocation {
        const inv = new XoWorkflowInvocation();
        inv.inputArea = new XoVariableArea();
        inv.label = 'Retrieve document';
        inv.$fqn = 'xact.templates.TemplateManagement';
        inv.operation = 'retrieve';
        return inv;
    }


    // not a workflow invocation - but works for now: TODO: - move it
    static endDocument(): XoWorkflowInvocation {
        const inv = new XoWorkflowInvocation();
        inv.inputArea = new XoVariableArea();
        inv.label = 'End document';
        inv.$fqn = 'xact.templates.TemplateManagement';
        inv.operation = 'stop';
        return inv;
    }
}


@XoArrayClass(XoWorkflowInvocation)
export class XoWorkflowInvocationArray extends XoArray<XoWorkflowInvocation> {
}
