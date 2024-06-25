import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Optional } from '@angular/core';
import { XcAutocompleteDataWrapper, XcOptionItemString, XcOptionItemTranslate } from '@zeta/xc';
import { I18nService } from '@zeta/i18n';
import { XoChangeMemberVariableStorableRoleRequest } from '@pmod/xo/change-member-variable-storable-role-request.model';
import { DocumentService } from '@pmod/document/document.service';
import { DatatypeVariableTabComponent } from '../datatype-tab.component';


@Component({
    templateUrl: './member-variable-storable-tab.component.html',
    styleUrls: ['./member-variable-storable-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberVariableStorableTabComponent extends DatatypeVariableTabComponent {

    private static readonly ROLE_UID = 'uniqueIdentifier';
    private static readonly ROLE_HISTO_TS = 'historizationTimeStamp';
    private static readonly ROLE_CUR_VER_FLAG = 'currentVersionFlag';

    readonly storableRoleDataWrapper: XcAutocompleteDataWrapper<string>;

    constructor(
        documentService: DocumentService,
        private readonly i18n: I18nService,
        cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(documentService, cdr, injector);

        this.storableRoleDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.memberVariable.storableRole ?? '',
            value => {
                if (this.memberVariable.storableRole !== value) {
                    this.memberVariable.storableRole = value;
                    this.performMemberVariableChange(new XoChangeMemberVariableStorableRoleRequest(undefined, value));
                }
            }
        );
        this.untilDestroyed(this.injectedData.update).subscribe(() => {
            this.refreshStorableRoleAutocomplete();
        });
    }


    private refreshStorableRoleAutocomplete() {
        this.storableRoleDataWrapper.values = [
            XcOptionItemString(),
            XcOptionItemTranslate(this.i18n, MemberVariableStorableTabComponent.ROLE_UID),
            XcOptionItemTranslate(this.i18n, MemberVariableStorableTabComponent.ROLE_HISTO_TS),
            XcOptionItemTranslate(this.i18n, MemberVariableStorableTabComponent.ROLE_CUR_VER_FLAG)
        ];
    }
}

