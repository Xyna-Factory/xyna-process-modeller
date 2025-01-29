/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Optional } from '@angular/core';
import { DocumentService } from '@pmod/document/document.service';
import { XoChangeLabelRequest } from '@pmod/xo/change-label-request.model';
import { DatatypeMethodTabComponent } from '../datatype-tab.component';

@Component({
    templateUrl: './method-base-tab.component.html',
    styleUrls: ['./method-base-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class MethodBaseTabComponent extends DatatypeMethodTabComponent {

    constructor(
        documentService: DocumentService,
        cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(documentService, cdr, injector);

        this.untilDestroyed(this.injectedData.update).subscribe(() => {
            this.cdr.markForCheck();
        });
    }

    labelBlur(event: FocusEvent) {
        if (!this.readonly) {
            const value = (event.target as HTMLInputElement).value;
            if (this.method.label !== value) {
                this.method.label = value;
                this.performMethodChange(new XoChangeLabelRequest(undefined, value));
            }
        }
    }
}
