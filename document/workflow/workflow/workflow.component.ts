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
export class WorkflowComponent extends ModellingItemComponent implements AfterViewChecked, AfterViewInit, OnDestroy {

    needCentering = true;
    needRestoring = true;

    private scrollListener: number;
    private clickListener: number;
    private currentScrollTop: number;
    private currentScrollLeft: number;

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
        ).subscribe(
            () => this.needRestoring = true
        );

        // restore scroll position after "tab change"
        this.untilDestroyed(this.documentService.selectionChange).subscribe(
            () => this.needRestoring = true
        );
    }


    @Input()
    set workflow(value: XoWorkflow) {
        this.setModel(value);
    }


    get workflow(): XoWorkflow {
        return this.getModel() as XoWorkflow;
    }


    ngAfterViewChecked() {
        const el = this.elementRef.nativeElement as HTMLElement;
        // hacked way of finding the moment when the element delivers the values for centering the window
        // TODO: Find a better solution to find out the moment that the element takes the space of all DOM children
        // into account
        if (el.scrollWidth !== 0 || el.scrollHeight !== 0) {
            if (this.needCentering) {
                this.needCentering = false;
                this.currentScrollLeft = (el.scrollWidth - el.clientWidth) / 2;
                el.scrollLeft = this.currentScrollLeft;
            }

            if (this.needRestoring) {
                this.needRestoring = false;
                this.restoreScrollPosition();
            }
        }
    }


    ngAfterViewInit() {
        const el = this.elementRef.nativeElement as HTMLElement;
        this.scrollListener = this.outsideListener.addOutsideListener(el, 'scroll', () => this.setScrollPosition());
        this.clickListener = this.outsideListener.addOutsideListener(el, 'click', () => this.selectionService.selectedObject = null);
        this.needRestoring = true;

        this.initialized.emit(this.workflow);
    }


    ngOnDestroy() {
        super.ngOnDestroy();
        this.outsideListener.removeOutsideListener(this.scrollListener);
        this.outsideListener.removeOutsideListener(this.clickListener);
    }


    setScrollPosition() {
        const el = this.elementRef.nativeElement as HTMLElement;

        if (el.scrollLeft) {
            this.currentScrollLeft = el.scrollLeft;
        }
        if (el.scrollTop) {
            this.currentScrollTop = el.scrollTop;
        }
    }


    restoreScrollPosition() {
        const el = this.elementRef.nativeElement as HTMLElement;
        el.scrollLeft = this.currentScrollLeft;
        el.scrollTop = this.currentScrollTop;
    }
}
