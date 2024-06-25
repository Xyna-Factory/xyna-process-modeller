import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Optional } from '@angular/core';
import { DocumentService } from '@pmod/document/document.service';
import { XoChangeLabelRequest } from '@pmod/xo/change-label-request.model';
import { DatatypeMethodTabComponent } from '../datatype-tab.component';

@Component({
    templateUrl: './method-base-tab.component.html',
    styleUrls: ['./method-base-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
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
