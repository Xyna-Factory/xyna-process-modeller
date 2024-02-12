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
import { RouterModule } from '@angular/router';

import { XynaRoutes } from '@zeta/nav';
import { RightGuardCanActivate } from '@zeta/nav/right.guard';

import { RIGHT_PROCESS_MODELLER } from './const';
import { ProcessmodellerComponent } from './processmodeller.component';
import { ProcessmodellerModule } from './processmodeller.module';


const root = 'Process-Modeller';

export const ProcessmodellerRoutes: XynaRoutes = [
    {
        path: '',
        redirectTo: root,
        pathMatch: 'full'
    },
    {
        path: root,
        component: ProcessmodellerComponent,
        canActivate: [RightGuardCanActivate],
        data: {
            right: RIGHT_PROCESS_MODELLER,
            reuse: root,
            title: root
        }
    }
];

export const ProcessmodellerRoutingModules = [
    RouterModule.forChild(ProcessmodellerRoutes),
    ProcessmodellerModule
];

export const ProcessmodellerRoutingProviders = [
];
