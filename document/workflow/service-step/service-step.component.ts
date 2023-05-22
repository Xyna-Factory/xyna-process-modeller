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
import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostBinding, Injector, Input, OnDestroy, Optional } from '@angular/core';
import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';

import { Subscription } from 'rxjs';

import { XoBranch } from '../../../xo/branch.model';
import { XoConditionalBranching } from '../../../xo/conditional-branching.model';
import { XoConditionalChoice } from '../../../xo/conditional-choice.model';
import { XoForeach } from '../../../xo/foreach.model';
import { XoInvocation } from '../../../xo/invocation.model';
import { XoItem } from '../../../xo/item.model';
import { XoMapping } from '../../../xo/mapping.model';
import { XoParallelism } from '../../../xo/parallelism.model';
import { XoQuery } from '../../../xo/query.model';
import { XoRetry } from '../../../xo/retry.model';
import { XoTemplate } from '../../../xo/template.model';
import { XoThrow } from '../../../xo/throw.model';
import { XoTypeChoice } from '../../../xo/type-choice.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { SelectionService } from '../../selection.service';
import { SelectableModellingObjectComponent } from '../shared/selectable-modelling-object.component';


@Component({
    selector: 'service-step',
    templateUrl: './service-step.component.html',
    styleUrls: ['./service-step.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceStepComponent extends SelectableModellingObjectComponent implements AfterViewChecked, OnDestroy {
    private _parentDirection: 'row' | 'column' = 'column';
    private readonly subscriptions: Subscription[] = [];

    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        readonly detailLevelService: WorkflowDetailLevelService,
        selectionService: SelectionService,
        private readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, selectionService, injector);
    }


    ngAfterViewChecked() {
        this.cdr.detectChanges();
    }


    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }


    @Input()
    set item(value: XoItem) {
        this.setModel(value);

        if (this.item && this.item.runtimeInfo) {
            this.subscriptions.push(
                this.item.runtimeInfo.inactiveChange.subscribe(() =>
                    this.cdr.detectChanges()
                )
            );
        }
    }


    get item(): XoItem {
        return this.getModel() as XoItem;
    }


    /** @todo Make it better */
    isBranch(): boolean {
        return this.item instanceof XoBranch;
    }


    /** @todo Make it better */
    isConditionalBranching(): boolean {
        return this.item instanceof XoConditionalBranching;
    }


    /** @todo Make it better */
    isConditionalChoice(): boolean {
        return this.item instanceof XoConditionalChoice;
    }


    /** @todo Make it better */
    isForeach(): boolean {
        return this.item instanceof XoForeach;
    }


    /** @todo Make it better */
    isInvocation(): boolean {
        return this.item instanceof XoInvocation && !(this.item instanceof XoQuery);
    }


    /** @todo Make it better */
    isMapping(): boolean {
        return this.item instanceof XoMapping;
    }


    /** @todo Make it better */
    isParallelism(): boolean {
        return this.item instanceof XoParallelism;
    }


    /** @todo Make it better */
    isQuery(): boolean {
        return this.item instanceof XoQuery;
    }


    /** @todo Make it better */
    isRetry(): boolean {
        return this.item instanceof XoRetry;
    }


    /** @todo Make it better */
    isTemplate(): boolean {
        return this.item instanceof XoTemplate;
    }


    /** @todo Make it better */
    isThrow(): boolean {
        return this.item instanceof XoThrow;
    }


    /** @todo Make it better */
    isTypeChoice(): boolean {
        return this.item instanceof XoTypeChoice;
    }


    @HostBinding('attr.parent-direction')
    @Input('parent-direction')
    set parentDirection(value: 'row' | 'column') {
        this._parentDirection = value;
    }

    get parentDirection(): 'row' | 'column' {
        return this._parentDirection;
    }


    /**
     * remark: Don't use css-class-HostBinding for this, because cdr.detectChanges only updates child-elements of this
     * and not this' element itself
     */
    get missingRuntimeInfo(): boolean {
        return this.item.missingRuntimeInfo || !!this.item.runtimeInfo?.inactive;
    }


    @HostBinding('class.erroneous-runtime-info')
    get erroneousRuntimeInfo(): boolean {
        return !!this.item.runtimeInfo?.hasError();
    }


    setCollapsed(collapsed: boolean) {
        // ignore collapsed state by intention for the wrapping service step (see below)
    }


    isDefaultCollapsed(): boolean {
        // A service step is just a generic container and shall not define a collapsed state.
        // The state is thus defined by the contained specific component
        return undefined;
    }
}
