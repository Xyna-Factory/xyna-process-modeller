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
import { Component, HostBinding, input } from '@angular/core';
import { XcIconComponent } from '@zeta/xc';

import { XoChoice } from '../../xo/choice.model';
import { XoConditionalBranching } from '../../xo/conditional-branching.model';
import { XoConditionalChoice } from '../../xo/conditional-choice.model';
import { XoInvocation } from '../../xo/invocation.model';
import { XoItem } from '../../xo/item.model';
import { XoMapping } from '../../xo/mapping.model';
import { XoModellingItem } from '../../xo/modelling-item.model';
import { XoParallelism } from '../../xo/parallelism.model';
import { XoQuery } from '../../xo/query.model';
import { XoTemplate } from '../../xo/template.model';
import { XoThrow } from '../../xo/throw.model';
import { XoTypeChoice } from '../../xo/type-choice.model';
import { XoVariable } from '../../xo/variable.model';
import { XoXmomItem } from '../../xo/xmom-item.model';


@Component({
    selector: 'clipboard-item',
    templateUrl: './clipboard-item.component.html',
    styleUrls: ['./clipboard-item.component.scss'],
    imports: [XcIconComponent]
})
export class ClipboardItemComponent {

    readonly item = input<XoItem>(undefined);


    get content(): XoItem[] {
        const item = this.item();
        if (item instanceof XoParallelism || item instanceof XoChoice) {
            return item.contentArea?.items.data ?? [];
        }
        return [];
    }


    get inputs(): XoItem[] {
        const item = this.item();
        if (item instanceof XoInvocation || item instanceof XoMapping) {
            return item.inputArea?.items.data ?? [];
        }
        if (item instanceof XoThrow) {
            return item.exceptionArea?.items.data ?? [];
        }
        return [];
    }


    get outputs(): XoItem[] {
        const item = this.item();
        if (item instanceof XoInvocation || item instanceof XoMapping) {
            return item.outputArea?.items.data ?? [];
        }
        return [];
    }


    get label(): string {
        const item = this.item();
        if (item instanceof XoInvocation) {
            return item.typeLabelArea?.text;
        }
        if (item instanceof XoModellingItem) {
            return item.label;
        }
        return '';
    }


    get icon(): string {
        const item = this.item();
        if (item instanceof XoMapping) {
            return 'tb-mapping';
        }
        if (item instanceof XoQuery) {
            return 'tb-database';
        }
        if (item instanceof XoThrow) {
            return 'tb-exception';
        }
        return '';
    }


    get isList(): boolean {
        const item = this.item();
        if (item instanceof XoVariable) {
            return item.isList;
        }
        return false;
    }


    @HostBinding('class.prototype')
    get isPrototype(): boolean {
        const item = this.item();
        return item instanceof XoXmomItem && item.isAbstract;
    }


    @HostBinding('class.branching')
    get isBranching(): boolean {
        return this.item() instanceof XoConditionalBranching;
    }


    @HostBinding('class.choice')
    get isChoice(): boolean {
        const item = this.item();
        return item instanceof XoConditionalChoice || item instanceof XoTypeChoice;
    }


    @HostBinding('class.invocation')
    get isInvocation(): boolean {
        return this.item() instanceof XoInvocation && !this.isQuery;
    }


    @HostBinding('class.mapping')
    get isMapping(): boolean {
        return this.item() instanceof XoMapping;
    }


    @HostBinding('class.parallelism')
    get isParallelism(): boolean {
        return this.item() instanceof XoParallelism;
    }


    @HostBinding('class.query')
    get isQuery(): boolean {
        return this.item() instanceof XoQuery;
    }


    @HostBinding('class.template')
    get isTemplate(): boolean {
        return this.item() instanceof XoTemplate;
    }


    @HostBinding('class.throw')
    get isThrow(): boolean {
        return this.item() instanceof XoThrow;
    }


    @HostBinding('class.variable')
    get isVariable(): boolean {
        return this.item() instanceof XoVariable;
    }
}
