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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';

import { MessageBusService } from '@yggdrasil/events';
import { AuthService } from '@zeta/auth';
import { XcFormInputComponent } from '@zeta/xc';

import { Subject } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';

import { CommonNavigationComponent } from '../common-navigation-class/common-navigation-component';
import { FactoryService } from '../factory.service';
import { XMOMListComponent } from '../xmom/xmom-list.component';
import { I18nModule } from '../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../zeta/xc/xc.module';


interface FilterData {
    label: string;
    checked: boolean;
    type: string;
}

export interface FilterConditionData {
    maxCount?: number;
    workflow?: boolean;
    dataType?: boolean;
    exceptionType?: boolean;
    serviceGroup?: boolean;
    service?: boolean;
}

@Component({
    selector: 'xfm-mod-nav-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [I18nModule, XcModule, XMOMListComponent]
})
export class SearchComponent extends CommonNavigationComponent {

    querySubject = new Subject<string>();
    debounce = false;

    @ViewChild(XMOMListComponent, { static: true })
    xmomList: XMOMListComponent;

    _inputComponent: XcFormInputComponent;
    @ViewChild('input', { static: false })
    set inputComponent(value: XcFormInputComponent) {
        if (this.zone) {
            this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                    value.setFocus();
                    this._inputComponent = value;
                }, 0);
            });
        } else {
            setTimeout(() => {
                value.setFocus();
                this._inputComponent = value;
            }, 0);
        }
    }

    get inputComponent(): XcFormInputComponent {
        return this._inputComponent;
    }

    get inputValue(): string {
        return this.inputComponent?.value ? this.inputComponent.value : '';
    }

    filterItems: FilterData[] = [
        { label: 'workflow', checked: true, type: 'workflow' },
        { label: 'data-type', checked: true, type: 'dataType' },
        { label: 'exception-type', checked: true, type: 'exceptionType' },
        { label: 'service-group', checked: true, type: 'serviceGroup' },
        { label: 'service', checked: true, type: 'service' }
    ];

    filterConditions: FilterConditionData;

    constructor(
        readonly messageBus: MessageBusService,
        readonly factoryService: FactoryService,
        private readonly zone: NgZone,
        cdr: ChangeDetectorRef,
        auth: AuthService
    ) {
        super(cdr);
        this.querySubject.pipe(debounceTime(500)).subscribe(query => {
            this.debounce = false;
            this.xmomList.find(query, this.filterConditions.maxCount, this.filterConditions);
        });

        messageBus.xmomChange.pipe(
            filter(changes => changes.creators.has(auth.username)),
            debounceTime(500)
        ).subscribe(() => this.search());

        factoryService.runtimeContextChange.pipe(
            filter(rtc => !!rtc),
            debounceTime(500)
        ).subscribe(() => {
            this.search();
            this.updateView();
        });
    }


    search() {
        this.filterConditions = {};
        this.filterConditions.maxCount = 100;
        for (const item of this.filterItems) {
            if (item.checked) {
                this.filterConditions[item.type] = item.checked;
            }
        }

        this.debounce = true;
        this.querySubject.next(this.inputValue);
    }

    onShow() {
        super.onShow();
        this.zone.runOutsideAngular(() => {
            setTimeout(() => {
                if (this.inputComponent) {
                    this.inputComponent.setFocus();
                }
            }, 0);
        });
    }
}
