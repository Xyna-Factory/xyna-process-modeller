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
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FactoryManagerModule } from '@fman/factory-manager.module';
import { I18nService } from '@zeta/i18n';
import { ZetaModule } from '@zeta/zeta.module';

import { XmomService } from './api/xmom.service';
import { ComponentMappingService } from './document/component-mapping.service';
import { DataTypeComponent } from './document/datatype.component';
import { DataTypeService } from './document/datatype.service';
import { CodingComponent } from './document/datatype/coding/coding.component';
import { ExceptionMessageRichListItemComponent } from './document/datatype/exception-message-rich-list-item/exception-message-rich-list-item.component';
import { ExceptionMessagesAreaComponent } from './document/datatype/exception-messages-area/exception-messages-area.component';
import { GlobalStorablePropertiesAreaComponent } from './document/datatype/global-storable-properties-area/global-storable-properties-area.component';
import { MemberServiceComponent } from './document/datatype/member-service/member-service.component';
import { MemberVariableAreaComponent } from './document/datatype/member-variable-area/member-variable-area.component';
import { MemberVariableDetailsComponent } from './document/datatype/member-variable-details/member-variable-details.component';
import { MemberVariableComponent } from './document/datatype/member-variable/member-variable.component';
import { MethodDetailsComponent } from './document/datatype/method-details/method-details.component';
import { MethodImplementationComponent } from './document/datatype/method-implementation/method-implementation.component';
import { ServiceAreaComponent } from './document/datatype/service-area/service-area.component';
import { StorablePropertiesAreaComponent } from './document/datatype/storable-properties-area/storable-properties-area.component';
import { TypeDocumentationAreaComponent } from './document/datatype/type-documentation-area/type-documentation-area.component';
import { ShowGUIModelModalModule } from './document/datatype/type-info-area/show-gui-model-modal/show-gui-model-modal.module';
import { TypeInfoAreaComponent } from './document/datatype/type-info-area/type-info-area.component';
import { DocumentService } from './document/document.service';
import { ExceptionTypeComponent } from './document/exceptiontype.component';
import { CloseDialogComponent } from './document/modal/close-dialog/close-dialog.component';
import { ConflictDialogComponent } from './document/modal/conflict-dialog/conflict-dialog.component';
import { ConstantDialogComponent } from './document/modal/constant-dialog/constant-dialog.component';
import { ErrorDialogComponent } from './document/modal/error-dialog/error-dialog.component';
import { RepairDialogComponent } from './document/modal/repair-dialog/repair-dialog.component';
import { RepairEntryComponent } from './document/modal/repair-dialog/repair-entry/repair-entry.component';
import { SelectionService } from './document/selection.service';
import { ServiceGroupComponent } from './document/servicegroup.component';
import { LibAreaComponent } from './document/shared/lib-area/lib-area.component';
import { JavaSharedLibAreaComponent } from './document/shared/java-shared-lib-area/java-shared-lib-area.component';
import { JavaSharedLibItemComponent } from './document/shared/java-shared-lib-area/java-shared-lib-item.component';
import { MemberAreaComponent } from './document/shared/member-area/member-area.component';
import { TypeDocumentComponent } from './document/type-document.component';
import { WorkflowDetailLevelService } from './document/workflow-detail-level.service';
import { WorkflowDocumentComponent } from './document/workflow-document.component';
import { ContentAreaComponent } from './document/workflow/content-area/content-area.component';
import { DataflowComponent } from './document/workflow/dataflow/dataflow.component';
import { BranchSelectionService } from './document/workflow/distinction/branch/branch-selection.service';
import { BranchComponent } from './document/workflow/distinction/branch/branch.component';
import { CaseAreaComponent } from './document/workflow/distinction/case-area/case-area.component';
import { CaseComponent } from './document/workflow/distinction/case/case.component';
import { ChoiceComponent } from './document/workflow/distinction/choice.component';
import { ConditionalBranchingComponent } from './document/workflow/distinction/conditional-branching/conditional-branching.component';
import { ConditionalChoiceComponent } from './document/workflow/distinction/conditional-choice/conditional-choice.component';
import { TypeChoiceComponent } from './document/workflow/distinction/type-choice/type-choice.component';
import { DocumentationAreaComponent } from './document/workflow/documentation-area/documentation-area.component';
import { DropIndicatorComponent } from './document/workflow/drop-indicator/drop-indicator.component';
import { CompensationComponent } from './document/workflow/exception/compensation/compensation.component';
import { ExceptionHandlingAreaComponent } from './document/workflow/exception/exception-handling-area/exception-handling-area.component';
import { ExceptionHandlingComponent } from './document/workflow/exception/exception-handling/exception-handling.component';
import { ItemBarAreaComponent } from './document/workflow/exception/item-bar-area/item-bar-area.component';
import { ThrowComponent } from './document/workflow/exception/throw/throw.component';
import { ForeachComponent } from './document/workflow/foreach/foreach.component';
import { FilterCriterionAreaComponent } from './document/workflow/formula-area/filter-criterion-area.component';
import { FormulaAreaComponent } from './document/workflow/formula-area/formula-area.component';
import { SelectionMaskCriterionAreaComponent } from './document/workflow/formula-area/selection-mask-criterion-area.component';
import { SortingCriterionAreaComponent } from './document/workflow/formula-area/sorting-criterion-area.component';
import { FormulaInputAreaComponent } from './document/workflow/formula-input-area/formula-input-area.component';
import { FormulaComponent } from './document/workflow/formula/formula.component';
import { FormulaEditablePartComponent } from './document/workflow/formula/parts/formula-editable-part.component';
import { FormulaPartFunctionComponent } from './document/workflow/formula/parts/formula-part-function/formula-part-function.component';
import { FormulaPartLiteralComponent } from './document/workflow/formula/parts/formula-part-literal/formula-part-literal.component';
import { FormulaPartMemberComponent } from './document/workflow/formula/parts/formula-part-member/formula-part-member.component';
import { FormulaPartOperationComponent } from './document/workflow/formula/parts/formula-part-operation/formula-part-operation.component';
import { FormulaPartSpecialComponent } from './document/workflow/formula/parts/formula-part-special/formula-part-special.component';
import { FormulaPartComponent } from './document/workflow/formula/parts/formula-part.component';
import { FormulaProxyComponent } from './document/workflow/formula/parts/formula-proxy/formula-proxy.component';
import { InvocationComponent } from './document/workflow/invocation/invocation.component';
import { LabelAreaComponent } from './document/workflow/label-area/label-area.component';
import { MappingComponent } from './document/workflow/mapping/mapping.component';
import { NonDraggableTextAreaComponent } from './document/workflow/non-draggable-text-area/non-draggable-text-area.component';
import { OrderInputSourceAreaComponent } from './document/workflow/order-input-source-area/order-input-source-area.component';
import { ParallelismComponent } from './document/workflow/parallelism/parallelism.component';
import { QueryComponent } from './document/workflow/query/query.component';
import { RemoteDestinationAreaComponent } from './document/workflow/remote-destination-area/remote-destination-area.component';
import { RetryComponent } from './document/workflow/retry/retry.component';
import { ServiceStepComponent } from './document/workflow/service-step/service-step.component';
import { ModDnDContentEditableDirective } from './document/workflow/shared/drag-and-drop/mod-dnd-content-editable.directive';
import { ModDragAndDropService } from './document/workflow/shared/drag-and-drop/mod-drag-and-drop.service';
import { ModDraggableDirective } from './document/workflow/shared/drag-and-drop/mod-draggable.directive';
import { ModDropAreaDirective } from './document/workflow/shared/drag-and-drop/mod-drop-area.directive';
import { ModContentEditableDirective } from './document/workflow/shared/mod-content-editable.directive';
import { ModellingItemComponent, ModellingObjectComponent } from './document/workflow/shared/modelling-object.component';
import { SelectableModellingObjectComponent } from './document/workflow/shared/selectable-modelling-object.component';
import { TextAreaModellingObjectComponent } from './document/workflow/shared/text-area-modelling-object.component';
import { TemplatePartFormulaComponent } from './document/workflow/template/template-part/template-part-formula.component';
import { TemplatePartTextComponent } from './document/workflow/template/template-part/template-part-text.component';
import { TemplatePartComponent } from './document/workflow/template/template-part/template-part.component';
import { TemplateRowComponent } from './document/workflow/template/template-row/template-row.component';
import { TemplateComponent } from './document/workflow/template/template.component';
import { TypeLabelAreaServiceComponent } from './document/workflow/type-label-area/type-label-area-service.component';
import { TypeLabelAreaComponent } from './document/workflow/type-label-area/type-label-area.component';
import { VariableAreaChoiceComponent } from './document/workflow/variable-area/variable-area-choice.component';
import { VariableAreaDocumentComponent } from './document/workflow/variable-area/variable-area-document.component';
import { VariableAreaServiceComponent } from './document/workflow/variable-area/variable-area-service.component';
import { VariableAreaComponent } from './document/workflow/variable-area/variable-area.component';
import { VariableComponent } from './document/workflow/variable/variable.component';
import { WorkflowComponent } from './document/workflow/workflow/workflow.component';
import { PmodOutsideListenerDirective } from './misc/directives/pmod-outside-listener.directives';
import { LabelPathDialogComponent } from './misc/modal/label-path-dialog/label-path-dialog.component';
import { ModellerSettingsDialogComponent } from './modeller-settings-dialog/modeller-settings-dialog.component';
import { ClipboardAreaComponent } from './navigation/clipboard/clipboard-area.component';
import { ClipboardItemComponent } from './navigation/clipboard/clipboard-item.component';
import { ClipboardComponent } from './navigation/clipboard/clipboard.component';
import { CompareComponent } from './navigation/compare/compare.component';
import { DetailsComponent } from './navigation/details/details.component';
import { RelationTableComponent } from './navigation/details/relation-table/relation-table.component';
import { ShowXmlModalComponent } from './navigation/details/show-xml-modal/show-xml-modal.component';
import { DevToolsModule } from './navigation/dev-tools/dev-tools.module';
import { ErrorsComponent } from './navigation/errors/errors.component';
import { FactoryService } from './navigation/factory.service';
import { FactoryComponent } from './navigation/factory/factory.component';
import { XMOMTreeItemComponent } from './navigation/factory/xmom-tree-item.component';
import { XMOMTreeComponent } from './navigation/factory/xmom-tree.component';
import { HelpComponent } from './navigation/help/help.component';
import { NavigationComponent } from './navigation/navigation.component';
import { SearchComponent } from './navigation/search/search.component';
import { ErrorItemComponent } from './navigation/shared/error-item/error-item.component';
import { ErrorService } from './navigation/shared/error.service';
import { WorkflowLauncherComponent } from './navigation/workflowlauncher/workflowlauncher.component';
import { XMOMListItemComponent } from './navigation/xmom/xmom-list-item.component';
import { XMOMListComponent } from './navigation/xmom/xmom-list.component';
import { ProcessmodellerComponent } from './processmodeller.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { WorkflowDetailSettingsService } from './workflow-detail-settings.service';
import { QueryParameterService } from '@zeta/nav/query-parameter.service';
import { VisualMappingComponent } from './document/workflow/visual-mapping/visual-mapping.component';
import { VariableTreeComponent } from './document/workflow/variable-tree/variable-tree.component';
import { VariableTreeNodeComponent } from './document/workflow/variable-tree-node/variable-tree-node.component';
import { FlowCanvasComponent } from './document/workflow/visual-mapping/flow-canvas/flow-canvas.component';
import { PluginService } from './document/plugin.service';
import { MemberVariableBaseTabComponent } from './document/datatype/tabs/member-variable/member-variable-base-tab.component';
import { MemberVariableMetaTabComponent } from './document/datatype/tabs/member-variable/member-variable-meta-tab.component';
import { MemberVariableStorableTabComponent } from './document/datatype/tabs/member-variable/member-variable-storable-tab.component';
import { MetaTagComponent } from './document/datatype/tabs/member-variable/meta-tag-rich-list/meta-tag-rich-list.component';
import { MethodMetaTabComponent } from './document/datatype/tabs/method/method-meta-tab.component';
import { MethodBaseTabComponent } from './document/datatype/tabs/method/method-base-tab.component';
import { MethodImplementationTabComponent } from './document/datatype/tabs/method/method-implementation-tab.component';
import { LibItemComponent } from './document/shared/lib-area/lib-item.component';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { FormsModule } from '@angular/forms';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ZetaModule,
        FactoryManagerModule,
        ShowGUIModelModalModule,
        DevToolsModule,
        MonacoEditorModule.forRoot()
    ],
    declarations: [
        BranchComponent,
        CaseAreaComponent,
        CaseComponent,
        ChoiceComponent,
        ClipboardComponent,
        ClipboardItemComponent,
        ClipboardAreaComponent,
        CloseDialogComponent,
        CodingComponent,
        CompareComponent,
        CompensationComponent,
        ConditionalBranchingComponent,
        ConditionalChoiceComponent,
        ConflictDialogComponent,
        ConstantDialogComponent,
        ContentAreaComponent,
        DataflowComponent,
        DataTypeComponent,
        DetailsComponent,
        DocumentationAreaComponent,
        DropIndicatorComponent,
        ErrorDialogComponent,
        ErrorItemComponent,
        ErrorsComponent,
        ExceptionHandlingAreaComponent,
        ExceptionHandlingComponent,
        ExceptionMessagesAreaComponent,
        ExceptionMessageRichListItemComponent,
        ExceptionTypeComponent,
        FactoryComponent,
        FilterCriterionAreaComponent,
        FlowCanvasComponent,
        ForeachComponent,
        FormulaAreaComponent,
        FormulaComponent,
        FormulaEditablePartComponent,
        FormulaInputAreaComponent,
        FormulaPartComponent,
        FormulaPartFunctionComponent,
        FormulaPartLiteralComponent,
        FormulaPartMemberComponent,
        FormulaPartOperationComponent,
        FormulaPartSpecialComponent,
        FormulaProxyComponent,
        GlobalStorablePropertiesAreaComponent,
        HelpComponent,
        InvocationComponent,
        ItemBarAreaComponent,
        JavaSharedLibAreaComponent,
        JavaSharedLibItemComponent,
        LabelAreaComponent,
        LabelPathDialogComponent,
        LibAreaComponent,
        LibItemComponent,
        MappingComponent,
        MemberAreaComponent,
        MemberServiceComponent,
        MemberVariableAreaComponent,
        MemberVariableComponent,
        MemberVariableBaseTabComponent,
        MemberVariableDetailsComponent,
        MemberVariableMetaTabComponent,
        MemberVariableStorableTabComponent,
        MetaTagComponent,
        MethodBaseTabComponent,
        MethodDetailsComponent,
        MethodMetaTabComponent,
        MethodImplementationComponent,
        MethodImplementationTabComponent,
        ModContentEditableDirective,
        ModDraggableDirective,
        ModDropAreaDirective,
        ModDnDContentEditableDirective,
        ModellerSettingsDialogComponent,
        ModellingItemComponent,
        ModellingObjectComponent,
        NavigationComponent,
        NonDraggableTextAreaComponent,
        OrderInputSourceAreaComponent,
        ParallelismComponent,
        PmodOutsideListenerDirective,
        ProcessmodellerComponent,
        QueryComponent,
        RemoteDestinationAreaComponent,
        RepairDialogComponent,
        RepairEntryComponent,
        RelationTableComponent,
        RetryComponent,
        SearchComponent,
        SelectableModellingObjectComponent,
        SelectionMaskCriterionAreaComponent,
        ServiceAreaComponent,
        ServiceGroupComponent,
        ServiceStepComponent,
        ShowXmlModalComponent,
        SortingCriterionAreaComponent,
        StorablePropertiesAreaComponent,
        TemplateComponent,
        TemplatePartComponent,
        TemplatePartFormulaComponent,
        TemplatePartTextComponent,
        TemplateRowComponent,
        TextAreaModellingObjectComponent,
        ThrowComponent,
        ToolbarComponent,
        TypeChoiceComponent,
        TypeDocumentationAreaComponent,
        TypeInfoAreaComponent,
        TypeLabelAreaComponent,
        TypeLabelAreaServiceComponent,
        TypeDocumentComponent,
        VariableAreaChoiceComponent,
        VariableAreaComponent,
        VariableAreaDocumentComponent,
        VariableAreaServiceComponent,
        VariableComponent,
        VariableTreeComponent,
        VariableTreeNodeComponent,
        VisualMappingComponent,
        WorkflowComponent,
        WorkflowDocumentComponent,
        WorkflowLauncherComponent,
        XMOMListComponent,
        XMOMListItemComponent,
        XMOMTreeComponent,
        XMOMTreeItemComponent
    ],
    exports: [
        DataflowComponent,
        ExceptionHandlingAreaComponent,
        TypeLabelAreaComponent,
        VariableAreaDocumentComponent,
        WorkflowComponent
    ],
    providers: [
        BranchSelectionService,
        ComponentMappingService,
        DataTypeService,
        DocumentService,
        FactoryService,
        I18nService,
        ModDragAndDropService,
        PluginService,
        QueryParameterService,
        WorkflowDetailSettingsService,
        WorkflowDetailLevelService,
        SelectionService,
        XmomService,
        ErrorService
    ]
})
export class ProcessmodellerModule {
}
