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
import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Injector, Input, OnDestroy, Optional, Output } from '@angular/core';

import { WorkflowDetailLevelService } from '@pmod/document/workflow-detail-level.service';
import { OutsideListenerService } from '@zeta/base';

import { filter } from 'rxjs/operators';

import { XoWorkflow } from '../../../xo/workflow.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DocumentService } from '../../document.service';
import { SelectionService } from '../../selection.service';
import { ModellingItemComponent } from '../shared/modelling-object.component';


@Component({
    selector: 'workflow',
    templateUrl: './workflow.component.html',
    styleUrls: ['./workflow.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: false
})
export class WorkflowComponent extends ModellingItemComponent implements AfterViewInit, OnDestroy {

    private scrollListener: number;
    private clickListener: number;
    private currentScrollTop = 0;
    private currentScrollLeft = 0;

    @Output()
    readonly initialized = new EventEmitter<XoWorkflow>();


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        readonly detailLevelService: WorkflowDetailLevelService,
        private readonly selectionService: SelectionService,
        private readonly outsideListener: OutsideListenerService,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        // restore scroll position after action
        this.untilDestroyed(this.documentService.xmomService.afterReceivedDataflow).pipe(
            filter(item => item === this.workflow)
        ).subscribe(() => this.restoreScrollPosition());

        // restore scroll position after "tab change"
        this.untilDestroyed(this.documentService.selectionChange).subscribe(() => this.restoreScrollPosition());
    }


    @Input()
    set workflow(value: XoWorkflow) {
        this.setModel(value);
    }

    get workflow(): XoWorkflow {
        return this.getModel() as XoWorkflow;
    }


    ngAfterViewInit() {
        const el = this.elementRef.nativeElement as HTMLElement;

        setTimeout(() => {
            if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
                this.currentScrollLeft = (el.scrollWidth - el.clientWidth) / 2;
                el.scrollLeft = this.currentScrollLeft;
            }
        });

        this.scrollListener = this.outsideListener.addOutsideListener(el, 'scroll', () => {
            if (this.documentService.ignoreProgrammaticScroll) {
                this.documentService.ignoreProgrammaticScroll = false;
                return;
            }
            this.setScrollPosition();
        });

        this.clickListener = this.outsideListener.addOutsideListener(el, 'click', () => {
            this.selectionService.selectedObject = null;
        });

        this.restoreScrollPosition();
        this.initialized.emit(this.workflow);
    }


    ngOnDestroy() {
        super.ngOnDestroy();
        this.outsideListener.removeOutsideListener(this.scrollListener);
        this.outsideListener.removeOutsideListener(this.clickListener);
    }


    private setScrollPosition() {
        const el = this.elementRef.nativeElement as HTMLElement;
        this.currentScrollLeft = el.scrollLeft;
        this.currentScrollTop = el.scrollTop;
    }


    private restoreScrollPosition() {
        const el = this.elementRef.nativeElement as HTMLElement;
        el.scrollLeft = this.currentScrollLeft;
        el.scrollTop = this.currentScrollTop;
    }
}