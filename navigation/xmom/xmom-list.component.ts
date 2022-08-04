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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';

import { coerceBoolean } from '@zeta/base';

import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { filter, first, map, switchMap, tap } from 'rxjs/operators';

import { XmomService } from '../../api/xmom.service';
import { XoXmomItem, XoXmomItemArray } from '../../xo/xmom-item.model';
import { FactoryService } from '../factory.service';
import { FilterConditionData } from '../search/search.component';


@Component({
    selector: 'xfm-mod-nav-xmomlist',
    templateUrl: './xmom-list.component.html',
    styleUrls: ['./xmom-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class XMOMListComponent {

    private _xmomItems = new XoXmomItemArray();
    private _pending = false;
    private _showFQN = false;

    readonly openMenusSubject = new BehaviorSubject<number>(0);


    constructor(private readonly xmomService: XmomService, private readonly factoryService: FactoryService, private readonly cdr: ChangeDetectorRef) {
    }


    @Input()
    set presetXmoms(value: XoXmomItemArray) {
        this._xmomItems = value;
    }


    /**
     * @param silent Perform a silent update with invisible clearing and without showing a spinner
     */
    private getXmomItems(observable: Observable<XoXmomItem[]>, valid: boolean, silent?: boolean) {
        if (valid) {
            this.cdr.detectChanges();
            this.openMenusSubject.pipe(
                filter(openCount => openCount === 0),       // only perform an update if no menu is open
                first(),                                    // ignore further menu-closings
                tap(() => {
                    if (!silent) {
                        this._pending = true;
                        this.clear();
                    }
                }),
                switchMap(() => observable)
            ).subscribe(objects => {
                this._pending = false;
                this.clear();
                this.xmomItems.append(...objects);
                this.cdr.detectChanges();
            });
        } else {
            this.clear();
        }
    }


    clear() {
        while (this.xmomItems.length > 0) {
            this.xmomItems.delete(0);
        }
        this.cdr.detectChanges();
    }


    find(query: string, maxCount: number, filterCondition: FilterConditionData) {
        this.getXmomItems(
            this.xmomService.findXmomItems(this.factoryService.runtimeContext, query, maxCount, filterCondition),
            !!query && maxCount > 0
        );
    }


    list(path: string) {
        this.getXmomItems(
            this.xmomService.listXmomItems(this.factoryService.runtimeContext, path),
            !!path
        );
    }


    listMultiple(paths: string[], silent?: boolean) {
        this.getXmomItems(
            forkJoin(
                paths.map(path =>
                    this.xmomService.listXmomItems(this.factoryService.runtimeContext, path)
                )
            ).pipe(
                map(input => Array.prototype.concat.call([], ...input))
            ),
            !!paths && paths.length > 0, silent
        );
    }


    @Input('show-fqn')
    set showFQN(value: boolean) {
        this._showFQN = coerceBoolean(value);
    }


    get showFQN(): boolean {
        return this._showFQN;
    }


    get xmomItems(): XoXmomItemArray {
        return this._xmomItems;
    }


    set xmomItems(values: XoXmomItemArray) {
        this._xmomItems = values;
    }


    get pending(): boolean {
        return this._pending;
    }
}
