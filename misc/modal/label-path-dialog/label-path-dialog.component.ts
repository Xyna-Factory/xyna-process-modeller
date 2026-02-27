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
import { Component, HostListener, inject, ViewChild } from '@angular/core';

import { I18nService, LocaleService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcFormDirective, XcOptionItem, XcOptionItemString } from '@zeta/xc';

import { Observable } from 'rxjs';

import { I18nModule } from '../../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../../zeta/xc/xc.module';
import { labelPathDialog_translations_de_DE } from './locale/label-path-dialog-translations.de-DE';
import { labelPathDialog_translations_en_US } from './locale/label-path-dialog-translations.en-US';


export interface LabelPathDialogResult {
    force: boolean;
    label: string;
    path: string;
}

export interface LabelPathDialogData {
    header: string;
    confirm: string;
    force?: string;
    forceTooltip?: string;
    presetLabel?: string;
    presetPath?: string;
    pathsObservable: Observable<string[]>;
    recentlyUsedPaths?: string[];
}


@Component({
    templateUrl: './label-path-dialog.component.html',
    styleUrls: ['./label-path-dialog.component.scss'],
    imports: [XcModule, I18nModule]
})
export class LabelPathDialogComponent extends XcDialogComponent<LabelPathDialogResult, LabelPathDialogData> {
    private readonly i18n = inject(I18nService);


    static readonly HEADER_SAVE_WORKFLOW_AS = 'Save Workflow as ...';
    static readonly HEADER_DEPLOY_TYPE_AS = 'Deploy Type as ...';
    static readonly HEADER_CONVERT_TO_WORKFLOW = 'Convert Service into Workflow';
    static readonly HEADER_CONVERT_TO_DATA_TYPE = 'Convert Parameter into Data Type';
    static readonly HEADER_MOVE_RENAME = 'pmod.move-rename';
    static readonly HEADER_REPLACE = 'pmod.replace';

    static readonly CONFIRM_SAVE = 'Save';
    static readonly CONFIRM_DEPLOY = 'Deploy';
    static readonly CONFIRM_CREATE = 'Create';
    static readonly CONFIRM_MOVE_RENAME = 'Move/Rename';
    static readonly CONFIRM_REPLACE = 'Replace';

    static readonly FORCE_MOVE_RENAME = 'Ignore Incompatible Storables';
    static readonly FORCE_MOVE_RENAME_TOOLTIP = 'When enabled, new columns/tables are created and no migration is performed, if refactoring affects existing storable Data Types.';

    @ViewChild(XcFormDirective, { static: true })
    form: XcFormDirective;

    force = false;
    label: string;
    path: string;


    readonly pathDataWrapper = new XcAutocompleteDataWrapper(
        () => this.path,
        value => this.path = value
    );


    constructor() {
        super();

        this.i18n.setTranslations(LocaleService.DE_DE, labelPathDialog_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, labelPathDialog_translations_en_US);

        this.label = this.injectedData.presetLabel || '';
        this.path = this.injectedData.presetPath || '';
        this.fillPathAutocomplete();
    }


    fillPathAutocomplete() {
        this.injectedData.pathsObservable.subscribe(paths => {
            if (this.injectedData.recentlyUsedPaths?.length > 0) {
                const recentPaths: XcOptionItem[] = this.injectedData.recentlyUsedPaths.map(recentPath => XcOptionItemString(recentPath));
                for (const recentPath of recentPaths) {
                    const pathIndex = paths.indexOf(recentPath.name);
                    paths.splice(pathIndex, 1);
                }
                recentPaths.unshift({
                    name: this.i18n.translate('Recently used paths'),
                    value: 'Recently used paths',
                    disabled: true,
                    icon: 'arrowright'
                });
                recentPaths.push({
                    name: this.i18n.translate('All paths'),
                    value: 'All paths',
                    disabled: true,
                    icon: 'arrowright'
                });

                this.pathDataWrapper.values = recentPaths.concat(paths.map(path => XcOptionItemString(path)));
            } else {
                this.pathDataWrapper.values = paths.map(path => XcOptionItemString(path));
            }
        });
    }


    save() {
        this.dismiss({
            force: this.force,
            label: this.label,
            path: this.path
        });
    }


    @HostListener('keydown.Enter')
    finish() {
        if (this.form.valid) {
            this.save();
        }
    }
}
