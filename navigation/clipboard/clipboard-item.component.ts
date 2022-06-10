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
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClipboardItemComponent {

    @Input()
    item: XoItem;


    get content(): XoItem[] {
        if (this.item instanceof XoParallelism || this.item instanceof XoChoice) {
            return this.item.contentArea?.items.data ?? [];
        }
        return [];
    }


    get inputs(): XoItem[] {
        if (this.item instanceof XoInvocation || this.item instanceof XoMapping) {
            return this.item.inputArea?.items.data ?? [];
        }
        if (this.item instanceof XoThrow) {
            return this.item.exceptionArea?.items.data ?? [];
        }
        return [];
    }


    get outputs(): XoItem[] {
        if (this.item instanceof XoInvocation || this.item instanceof XoMapping) {
            return this.item.outputArea?.items.data ?? [];
        }
        return [];
    }


    get label(): string {
        if (this.item instanceof XoInvocation) {
            return this.item.typeLabelArea?.text;
        }
        if (this.item instanceof XoModellingItem) {
            return this.item.label;
        }
        return '';
    }


    get icon(): string {
        if (this.item instanceof XoMapping) {
            return 'tb-mapping';
        }
        if (this.item instanceof XoQuery) {
            return 'tb-database';
        }
        if (this.item instanceof XoThrow) {
            return 'tb-exception';
        }
        return '';
    }


    get isList(): boolean {
        if (this.item instanceof XoVariable) {
            return this.item.isList;
        }
        return false;
    }


    @HostBinding('class.prototype')
    get isPrototype(): boolean {
        return this.item instanceof XoXmomItem && this.item.isAbstract;
    }


    @HostBinding('class.branching')
    get isBranching(): boolean {
        return this.item instanceof XoConditionalBranching;
    }


    @HostBinding('class.choice')
    get isChoice(): boolean {
        return this.item instanceof XoConditionalChoice || this.item instanceof XoTypeChoice;
    }


    @HostBinding('class.invocation')
    get isInvocation(): boolean {
        return this.item instanceof XoInvocation && !this.isQuery;
    }


    @HostBinding('class.mapping')
    get isMapping(): boolean {
        return this.item instanceof XoMapping;
    }


    @HostBinding('class.parallelism')
    get isParallelism(): boolean {
        return this.item instanceof XoParallelism;
    }


    @HostBinding('class.query')
    get isQuery(): boolean {
        return this.item instanceof XoQuery;
    }


    @HostBinding('class.template')
    get isTemplate(): boolean {
        return this.item instanceof XoTemplate;
    }


    @HostBinding('class.throw')
    get isThrow(): boolean {
        return this.item instanceof XoThrow;
    }


    @HostBinding('class.variable')
    get isVariable(): boolean {
        return this.item instanceof XoVariable;
    }
}
