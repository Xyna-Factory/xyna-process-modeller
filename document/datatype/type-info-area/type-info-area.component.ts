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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, Input, OnInit, Optional, ViewChild } from '@angular/core';

import { FullQualifiedName, XoStructureType } from '@zeta/api';
import { isString } from '@zeta/base';
import { XcAutocompleteDataWrapper, XcCheckboxComponent, XcDialogService, XcFormAutocompleteComponent, XcOptionItemString, XcOptionItemStringOrUndefined } from '@zeta/xc';

import { merge, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { ModellingActionType } from '../../../api/xmom.service';
import { WorkflowDetailLevelService } from '../../../document/workflow-detail-level.service';
import { XoChangeAbstractRequest } from '../../../xo/change-abstract-request.model';
import { XoChangeBaseTypeRequest } from '../../../xo/change-base-type-request.model';
import { XoChangeLabelRequest } from '../../../xo/change-label-request.model';
import { XoDataTypeTypeLabelArea } from '../../../xo/data-type-type-label-area.model';
import { XoData } from '../../../xo/data.model';
import { XoServiceGroupTypeLabelArea } from '../../../xo/service-group-type-label-area.model';
import { XoXmomItem } from '../../../xo/xmom-item.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { DataTypeService } from '../../datatype.service';
import { DocumentService } from '../../document.service';
import { DataTypeDocumentModel } from '../../model/data-type-document.model';
import { ExceptionTypeDocumentModel } from '../../model/exception-type-document.model';
import { ServiceGroupDocumentModel } from '../../model/service-group-document.model';
import { TypeDocumentModel } from '../../model/type-document.model';
import { ModDropEvent } from '../../workflow/shared/drag-and-drop/mod-drop-area.directive';
import { ModellingObjectComponent } from '../../workflow/shared/modelling-object.component';
import { ShowGuiModelModalComponent } from './show-gui-model-modal/show-gui-model-modal.component';


@Component({
    selector: 'type-info-area',
    templateUrl: './type-info-area.component.html',
    styleUrls: ['./type-info-area.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypeInfoAreaComponent extends ModellingObjectComponent implements OnInit {

    private _isStorable: boolean;

    pathDataWrapper: XcAutocompleteDataWrapper;
    baseTypeDataWrapper: XcAutocompleteDataWrapper;

    @Input()
    showConverterButton = false;

    @Input()
    showRefactorButton = false;

    @Input()
    showBaseTypeAutocomplete = false;

    @Input()
    showAbstractCheckbox = false;

    @ViewChild('isStorableCheckbox', {static: false, read: XcCheckboxComponent})
    isStorableCheckbox: XcCheckboxComponent;


    constructor(
        elementRef: ElementRef,
        componentMappingService: ComponentMappingService,
        documentService: DocumentService,
        detailLevelService: WorkflowDetailLevelService,
        private readonly dataTypeService: DataTypeService,
        private readonly dialogService: XcDialogService,
        private readonly cdr: ChangeDetectorRef,
        @Optional() injector: Injector
    ) {
        super(elementRef, componentMappingService, documentService, detailLevelService, injector);

        this.pathDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.typeDocument.newTypePath,
            value => this.typeDocument.newTypePath = value
        );

        this.baseTypeDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.typeInfoArea.baseType,
            value => {
                if (this.typeInfoArea.baseType !== value) {
                    this.setBaseType(value);
                }
            }
        );

        this.untilDestroyed(
            merge(
                this.pathDataWrapper.valuesChange,
                this.baseTypeDataWrapper.valuesChange
            )
        ).subscribe(
            () => this.cdr.detectChanges()
        );
    }


    ngOnInit() {
        super.ngOnInit();
        // refresh base types, so that clicking the storable checkbox can set the storable base type
        this.refreshBaseTypeAutocomplete();
        this.updateStorableFlag();
    }


    @ViewChild('pathAutocomplete', {static: false, read: XcFormAutocompleteComponent})
    set pathAutocomplete(value: XcFormAutocompleteComponent) {
        this.untilDestroyed(value?.focus)?.pipe(filter(() => !value.disabled)).subscribe(() => this.refreshPathAutocomplete());
    }


    @ViewChild('baseTypeAutocomplete', {static: false, read: XcFormAutocompleteComponent})
    set baseTypeAutocomplete(value: XcFormAutocompleteComponent) {
        this.untilDestroyed(value?.focus)?.pipe(filter(() => !value.disabled)).subscribe(() => this.refreshBaseTypeAutocomplete());
    }


    get typeDocument(): TypeDocumentModel {
        return this.documentModel as TypeDocumentModel;
    }


    get typeInfoArea(): XoDataTypeTypeLabelArea & XoServiceGroupTypeLabelArea {
        return this.getModel() as XoDataTypeTypeLabelArea;
    }


    @Input()
    set typeInfoArea(value: XoDataTypeTypeLabelArea & XoServiceGroupTypeLabelArea) {
        this.setModel(value);
        if (value) {
            this.baseTypeDataWrapper.preset(v => XcOptionItemStringOrUndefined(v));
            this.updateStorableFlag();
        }
    }


    get isNewDocument(): boolean {
        return !this.typeDocument?.item.saved;
    }


    get isExceptionTypeDocument(): boolean {
        return this.typeDocument instanceof ExceptionTypeDocumentModel;
    }


    get isDataTypeDocument(): boolean {
        return this.typeDocument instanceof DataTypeDocumentModel;
    }


    get isServiceGroupDocument(): boolean {
        return this.typeDocument instanceof ServiceGroupDocumentModel;
    }


    get label(): string {
        return this.typeInfoArea.text;
    }


    set label(value: string) {
        this.typeInfoArea.text = value;
        this.typeDocument.item.label = value;
    }


    get title(): string {
        if (this.isDataTypeDocument) {
            return 'Data Type';
        }
        if (this.isExceptionTypeDocument) {
            return 'Exception Type';
        }
        if (this.isServiceGroupDocument) {
            return 'Service Group';
        }
        return '';
    }


    get isAbstract(): boolean {
        return this.typeInfoArea.isAbstract;
    }


    set isAbstract(value: boolean) {
        if (this.typeInfoArea.isAbstract !== value) {
            this.typeInfoArea.isAbstract = value;

            this.performAction({
                type:     ModellingActionType.change,
                request:  XoChangeAbstractRequest.changeTo(this.typeInfoArea.isAbstract),
                objectId: this.typeInfoArea.id
            });
        }
    }


    get isStorable(): boolean {
        return this._isStorable;
    }


    set isStorable(value: boolean) {
        if (value) {
            // setting storable base type
            if (this.typeInfoArea.baseType) {
                this.dialogService.confirm(
                    'Warning',
                    `Current base type '${this.typeInfoArea.baseType}' will be changed.`
                ).afterDismiss().subscribe(result => {
                    if (result) {
                        this._isStorable = true;
                        this.setBaseType(DataTypeService.STORABLE, true);
                        this.baseTypeDataWrapper.update();
                    } else {
                        this.preventStorableCheckboxChange(false);
                    }
                });
            } else {
                this._isStorable = true;
                this.setBaseType(DataTypeService.STORABLE, true);
                this.baseTypeDataWrapper.update();
            }
        } else {
            // removing storable base type
            this.dialogService.confirm(
                'Warning',
                `Current base type '${this.typeInfoArea.baseType}' will be removed.`
            ).afterDismiss().subscribe(result => {
                if (result) {
                    this._isStorable = false;
                    this.setBaseType(undefined, true);
                    this.baseTypeDataWrapper.preset(v => XcOptionItemStringOrUndefined(v));
                } else {
                    this.preventStorableCheckboxChange(true);
                }
            });
        }
    }


    protected lockedChanged() {
        this.cdr.markForCheck();
    }


    /**
     * Two-way binding the checkbox value does not change the value of the checkbox when the private value under the setter changes.
     * Therefore this function is used to force a value on the checkbox.
    */
    private preventStorableCheckboxChange(value: boolean) {
        this._isStorable = value;
        this.isStorableCheckbox.checked = value;
        this.cdr.detectChanges();
    }


    private setBaseType(value: string, skipStorableCheck?: boolean) {
        this.typeInfoArea.baseType = value;

        if (!this.isExceptionTypeDocument || this.typeInfoArea.baseType) {
            this.performAction({
                type:     ModellingActionType.change,
                request:  XoChangeBaseTypeRequest.changeTo(this.typeInfoArea.baseType ?? ''),
                objectId: this.typeInfoArea.id
            });
        }

        if (!skipStorableCheck) {
            this.updateStorableFlag();
        }
    }


    private updateStorableFlag() {
        if (this.typeInfoArea.baseType) {
            if (this.typeInfoArea.baseType === DataTypeService.STORABLE) {
                this._isStorable = true;
            } else if (this.typeDocument) {
                // check, if base type is a subtype of storable
                const rtc = this.typeDocument.item.toRtc();
                this.dataTypeService.getStorableTypes(rtc).subscribe(structureTypes => {
                    this._isStorable = structureTypes.some(structureType => structureType.typeFqn.uniqueKey === this.typeInfoArea.baseType);
                    this.cdr.detectChanges();
                });
            }
        } else {
            this._isStorable = false;
        }
    }


    private refreshPathAutocomplete() {
        const rtc = this.typeDocument.item.$rtc;
        this.documentService.getPaths(rtc.runtimeContext()).subscribe(paths =>
            this.pathDataWrapper.values = paths.map(path => XcOptionItemString(path))
        );
    }


    private refreshBaseTypeAutocomplete() {
        if (this.showBaseTypeAutocomplete) {
            const fqn = this.typeDocument.item.$fqn;
            const rtc = this.typeDocument.item.toRtc();
            let observable: Observable<XoStructureType[]>;
            if (this.isExceptionTypeDocument) {
                observable = this.dataTypeService.getExceptionTypes(rtc, [fqn, DataTypeService.CORE_EXCEPTION]);
            }
            if (this.isDataTypeDocument) {
                observable = this.dataTypeService.getDataTypesWithoutExceptionTypes(rtc, [fqn, DataTypeService.ANYTYPE]);
            }
            observable?.subscribe(structureTypes =>
                this.baseTypeDataWrapper.values = structureTypes.map(type => XcOptionItemString(type.typeFqn.uniqueKey))
            );
        }
    }


    allowItem = (xoFqn: string): boolean =>
        !this.readonly &&
        isString(xoFqn) &&
        isString(XoData.fqn.uniqueKey) &&
        xoFqn.toLocaleLowerCase() === XoData.fqn.uniqueKey.toLocaleLowerCase();


    dropped(event: ModDropEvent) {
        const fqn = (event.item as XoXmomItem).$fqn;
        this.baseTypeDataWrapper.setter(fqn);
    }


    openBaseType() {
        const rtc = this.typeDocument.item.toRtc();
        const fqn = FullQualifiedName.decode(this.typeInfoArea.baseType);
        if (this.isExceptionTypeDocument) {
            this.documentService.loadExceptionType(rtc, fqn);
        }
        if (this.isDataTypeDocument) {
            this.documentService.loadDataType(rtc, fqn);
        }
    }


    labelBlur(event: FocusEvent) {
        if (!this.readonly) {
            const text = (event.target as HTMLInputElement).value;
            if (this.label !== text) {
                this.performAction({
                    type: ModellingActionType.change,
                    objectId: this.typeInfoArea.id,
                    request: new XoChangeLabelRequest(undefined, text)
                });
            }
        }
    }


    refactor() {
        if (!this.readonly) {
            this.documentService.refactorItem(this.typeDocument.item).subscribe();
        }
    }


    showConverter() {
        this.dialogService.custom(ShowGuiModelModalComponent, {datatype: this.typeDocument.item});
    }
}
