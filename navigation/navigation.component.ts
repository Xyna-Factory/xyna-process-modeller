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
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';

import { XoArray } from '@zeta/api';
import { XcDialogService, XcMenuItem, XoPlugin, XoPluginArray } from '@zeta/xc';

import { merge, of, Subscription } from 'rxjs';

import { XmomService } from '../api/xmom.service';
import { DocumentService } from '../document/document.service';
import { ClipboardComponent } from './clipboard/clipboard.component';
import { CommonNavigationComponent } from './common-navigation-class/common-navigation-component';
import { CompareComponent } from './compare/compare.component';
import { DetailsComponent } from './details/details.component';
import { WorkflowConstantBuilderModalComponent } from './dev-tools/workflow-constant-builder-modal/workflow-constant-builder-modal.component';
import { ErrorsComponent } from './errors/errors.component';
import { FactoryComponent } from './factory/factory.component';
import { HelpComponent } from './help/help.component';
import { SearchComponent } from './search/search.component';
import { TypeDocumentModel } from '@pmod/document/model/type-document.model';
import { PluginService } from '@pmod/document/plugin.service';
import { NavPluginComponent } from './nav-plugin/nav-plugin.component';

enum NavigationbarArea {
    Factory = 1,
    Search,
    Details,
    Clipboard,
    Errors,
    Compare,
    Help,
    Plugin
}

export interface NavigationItem {
    label: string;
    iconName: string;
    iconStyle: string;
    areaType: number;
    badge?: number;
    pluginNumber?: number;
}

export enum AreaValue {
    Closed = 'closed',
    Opened = 'opened',
    OpenedHalf = 'opened_half'
}

@Component({
    selector: 'xfm-mod-nav',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
    animations: [
        trigger('areaTrigger', [
            state('closed', style({
                width: '0'
            })),
            state('opened', style({
                width: '300px'
            })),
            state('opened_half', style({
                width: '50vw'
            })),
            transition('closed <=> opened', animate('.3s ease-in')),
            transition('closed <=> opened_half', animate('.3s ease-in')),
            transition('opened_half => opened', animate('0s ease-in')),
            transition('opened => opened_half', animate('.3s ease-in'))
        ])
    ]/*,
    changeDetection: ChangeDetectionStrategy.OnPush*/
})
export class NavigationComponent implements OnInit, AfterViewInit, OnDestroy {

    readonly NavigationbarArea = NavigationbarArea;

    area = NavigationbarArea.Factory;
    activatedPluginNumber: number;
    areaValue = AreaValue.Opened;

    @ViewChild(FactoryComponent, { static: true }) factoryComponent: FactoryComponent;
    @ViewChild(SearchComponent, { static: true }) searchComponent: SearchComponent;
    @ViewChild(DetailsComponent, { static: true }) detailsComponent: DetailsComponent;
    @ViewChild(ClipboardComponent, { static: true }) clipboardComponent: ClipboardComponent;
    @ViewChild(ErrorsComponent, { static: true }) errorsComponent: ErrorsComponent;
    @ViewChild(CompareComponent, { static: true }) compareComponent: CompareComponent;
    @ViewChild(HelpComponent, { static: true }) helpComponent: HelpComponent;
    @ViewChildren(NavPluginComponent) pluginComponents: QueryList<NavPluginComponent>;

    private lastOpened: NavigationbarArea = null;
    private readonly viewComponentMap = new Map<NavigationbarArea, CommonNavigationComponent>();

    private readonly subscriptions: Subscription[] = [];
    private errorsChangeSubscription: Subscription;

    private readonly factoryButton: NavigationItem = { label: 'icon-factory', iconName: 'sp-xynanavigation', iconStyle: 'modeller', areaType: NavigationbarArea.Factory };
    private readonly searchButton: NavigationItem = { label: 'icon-search', iconName: 'sp-search', iconStyle: 'modeller', areaType: NavigationbarArea.Search };
    private readonly detailsButton: NavigationItem = { label: 'icon-details', iconName: 'sp-properties', iconStyle: 'modeller', areaType: NavigationbarArea.Details };
    private readonly clipboardButton: NavigationItem = { label: 'icon-clipboard', iconName: 'copy', iconStyle: 'xds', areaType: NavigationbarArea.Clipboard };
    private readonly errorsButton: NavigationItem = { label: 'icon-issues', iconName: 'msgwarning', iconStyle: 'xds', areaType: NavigationbarArea.Errors };
    private readonly compareButton: NavigationItem = { label: 'icon-compare', iconName: 'misc-splitview', iconStyle: 'modeller', areaType: NavigationbarArea.Compare };
    private readonly helpButton: NavigationItem = { label: 'icon-help', iconName: 'sp-helper', iconStyle: 'modeller', areaType: NavigationbarArea.Help };

    private readonly defaultButtons: NavigationItem[] = [
        this.factoryButton,
        this.searchButton,
        this.detailsButton,
        this.clipboardButton,
        this.errorsButton,
        this.compareButton,
        this.helpButton
    ];
    private datatypePluginButtons: NavigationItem[] = [];

    buttons: NavigationItem[] = this.defaultButtons;

    readonly devMenuItems: XcMenuItem[] = [
        { name: 'Workflow Constant Builder...', click: () => this.dialogService.custom(WorkflowConstantBuilderModalComponent) },
        { name: 'Data Type Converter...', click: () => this.dialogService.info('info', 'not yet implemented') }
    ];

    private _datatypePlugins: XoPlugin[] = [];


    constructor(
        private readonly documentService: DocumentService,
        private readonly dialogService: XcDialogService,
        private readonly xmomService: XmomService,
        private readonly pluginService: PluginService
    ) {
        this.pluginService.requestPluginsByPath(['datatypes/rightnav']).subscribe({
            next: (plugins: XoPluginArray) => {
                this._datatypePlugins = plugins.data;
                this.datatypePluginButtons = this._datatypePlugins.map((plugin: XoPlugin, index: number) => {
                    const item: NavigationItem = this.createPluginItem(plugin);
                    item.pluginNumber = index;
                    return item;
                });
                if (this.documentService.selectedDocument instanceof TypeDocumentModel) {
                    this.buttons = this.defaultButtons.concat(this.datatypePluginButtons);
                }
            }
        });
    }


    ngOnInit() {
        this.viewComponentMap
            .set(NavigationbarArea.Factory, this.factoryComponent)
            .set(NavigationbarArea.Search, this.searchComponent)
            .set(NavigationbarArea.Details, this.detailsComponent)
            .set(NavigationbarArea.Clipboard, this.clipboardComponent)
            .set(NavigationbarArea.Errors, this.errorsComponent)
            .set(NavigationbarArea.Compare, this.compareComponent)
            .set(NavigationbarArea.Help, this.helpComponent);

        this.switchArea(NavigationbarArea.Factory);
    }


    ngAfterViewInit() {
        this.subscriptions.push(merge(
            this.documentService.selectionChange,
            this.documentService.documentChange,
            this.xmomService.itemSaved,
            this.xmomService.itemDeployed
        ).subscribe(() => {
            this.activeNavigationComponent?.updateView();
        }));

        this.subscriptions.push(this.documentService.selectionChange.subscribe(document => {
            this.errorsChangeSubscription?.unsubscribe();
            this.errorsChangeSubscription = (document ? merge(document.issuesChange, document.warningsChange) : of(new XoArray())).subscribe(() => {
                this.errorsButton.badge = document?.issues && document?.warnings ? document.issues.length + document.warnings.length : undefined;
            });

            if (document instanceof TypeDocumentModel) {
                this.buttons = this.defaultButtons.concat(this.datatypePluginButtons);
            } else {
                this.buttons = this.defaultButtons;
            }
        }));
    }


    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.errorsChangeSubscription?.unsubscribe();
    }


    private createPluginItem(plugin: XoPlugin): NavigationItem {
        return {
            label: plugin.navigationEntryLabel,
            iconName: plugin.navigationIconName,
            iconStyle: 'modeller',
            areaType: NavigationbarArea.Plugin
        };
    }


    switchArea(area: NavigationbarArea, pluginNumber?: number) {
        // trigger onHide() of the switched off nav component
        if (this.activeNavigationComponent) {
            this.activeNavigationComponent.onHide();
        }

        // change activeNavigationComponent
        this.area = area;
        this.activatedPluginNumber = pluginNumber;

        // use a special animation for the compare area
        if (this.area === NavigationbarArea.Compare) {
            this.areaValue = AreaValue.OpenedHalf;
        } else {
            this.areaValue = AreaValue.Opened;
        }

        // trigger onShow() for the switched in nav component
        if (this.activeNavigationComponent) {
            this.activeNavigationComponent.onShow();
            this.activeNavigationComponent.updateView();
        }
    }


    toogle() {
        if (this.area) {
            this.lastOpened = this.area;
            this.area = null;
            this.areaValue = AreaValue.Closed;
        } else {
            this.switchArea(this.lastOpened);
            this.lastOpened = null;
        }
    }


    get activeNavigationComponent(): CommonNavigationComponent {
        if (this.area === NavigationbarArea.Plugin) {
            return this.pluginComponents.find(comp => comp.pluginNumber === this.activatedPluginNumber);
        }
        return this.viewComponentMap.get(this.area);
    }

    get datatypePlugins(): XoPlugin[] {
        return this._datatypePlugins;
    }
}
