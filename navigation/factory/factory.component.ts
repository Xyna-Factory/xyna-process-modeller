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
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';

import { MessageBusService } from '@yggdrasil/events';

import { merge, of } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';

import { XmomPath } from '../../api/xmom.service';
import { DocumentService } from '../../document/document.service';
import { CommonNavigationComponent } from '../common-navigation-class/common-navigation-component';
import { FactoryService } from '../factory.service';
import { XMOMListComponent } from '../xmom/xmom-list.component';
import { XMOMTreeItemState } from './xmom-tree-item.component';
import { I18nModule } from '../../../../zeta/i18n/i18n.module';
import { XcModule } from '../../../../zeta/xc/xc.module';
import { PmodOutsideListenerDirective } from '../../misc/directives/pmod-outside-listener.directives';
import { XMOMTreeComponent } from './xmom-tree.component';


@Component({
    selector: 'xfm-mod-nav-factory',
    templateUrl: './factory.component.html',
    styleUrls: ['./factory.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [I18nModule, XcModule, PmodOutsideListenerDirective, XMOMTreeComponent, XMOMListComponent]
})
export class FactoryComponent extends CommonNavigationComponent implements AfterViewInit {

    private static readonly DepartmentLabels = {
        xmcp: 'Multi-Channel Portal',
        xprc: 'Processing, Other',
        xint: 'Factory Intelligence',
        xoss: 'OSS Gateway',
        xpmg: 'Product Management',
        xprv: 'Dynamic Network Configuration, Provisioning',
        xdev: 'Development Factory',
        xfmg: 'Factory Management',
        xsas: 'Service Assurance',
        xmes: 'Manufacturing Excecution System',
        xbss: 'BSS Gateway',
        xnwh: 'Factory Warehouse',
        xact: 'Activation'
    };

    @ViewChild(XMOMListComponent, {static: true})
    xmomList: XMOMListComponent;

    xmomPaths = new Array<XmomPath>();
    flatPaths = new Set<string>();

    selectedPath: string;
    selectedDepartment: string;
    hoveredDepartment: string;
    hoveredDepartmentLabel: string;

    selectedPaths = new Set<string>();
    expandedPaths = new Set<string>();
    selectedXmomPaths = new Array<XmomPath>();
    expandedXmomPaths = new Array<XmomPath>();


    constructor(
        cdr: ChangeDetectorRef,
        readonly factoryService: FactoryService,
        readonly documentService: DocumentService,
        private readonly messageBus: MessageBusService
    ) {
        super(cdr);
    }


    ngAfterViewInit() {
        // update xmom path tree
        merge(
            this.factoryService.runtimeContextChange,
            this.messageBus.xmomChange.pipe(filter(changes =>
                // performance: For saves, only consider changes for paths, that are not known yet
                changes.deletes.length > 0 || ![...changes.paths].some(path => this.flatPaths.has(path))
            )),
            this.messageBus.xmomChangedRTCDependencies.pipe(
                filter(change => change.$rtc.toRuntimeContext().equals(this.factoryService.runtimeContext))
            )
        ).pipe(
            debounceTime(500),
            switchMap(() =>
                this.documentService.xmomService.listXmomPaths(this.factoryService.runtimeContext, undefined, 'compact')
            ),
            tap(xmomPaths => {
                // top-level xmom paths should be expanded initially
                if (this.xmomPaths.length === 0) {
                    xmomPaths.forEach(xmomPath => this.expandedPaths.add(xmomPath.path));
                }
                // set xmom paths and restore tree
                this.selectedDepartment = undefined;
                this.xmomPaths = xmomPaths;
                this.restore(false);
                this.updateView();

                // fill flat paths
                const insertFlatPath = (xmomPath: XmomPath, prefixPath: string) => {
                    const path = prefixPath ? prefixPath + '.' + xmomPath.path : xmomPath.path;
                    this.flatPaths.add(path);
                    xmomPath.children?.forEach(child => insertFlatPath(child, path));
                };
                this.flatPaths.clear();
                this.xmomPaths.forEach(path => insertFlatPath(path, ''));
            })
        ).subscribe();

        // update rtc data wrapper
        merge(
            of(undefined),
            this.factoryService.runtimeContextChange
        ).subscribe(() => {
            this.factoryService.runtimeContextDataWrapper.update();
            this.updateView();
        });

        // refresh objects for an XMOM change within the selected path
        merge(
            this.messageBus.xmomChange.pipe(
                filter(xmomChangeBundle => [...xmomChangeBundle.paths].some(path => this.selectedPaths.has(path)))
            ),
            this.messageBus.xmomChangedRTCDependencies.pipe(
                filter(change => change.$rtc.toRuntimeContext().equals(this.factoryService.runtimeContext))
            )
        ).subscribe(() => this.restore(true));
    }


    findXmomPath(xmomPaths: XmomPath[], path: string): XmomPath {
        for (const xmomPath of xmomPaths) {
            if (xmomPath.path === path) {
                return xmomPath;
            }
            const sub = xmomPath.path ? xmomPath.path + '.' : xmomPath.path;
            if (xmomPath.children && path.indexOf(sub) === 0) {
                path = sub ? path.substring(sub.length) : path;
                return this.findXmomPath(xmomPath.children, path);
            }
        }
    }


    restoreXmomPaths(xmomPaths: XmomPath[], set: Set<string>): XmomPath[] {
        return Array.from(set.values())
            .map(path => {
                const xmomPath = this.findXmomPath(xmomPaths, path);
                if (!xmomPath) {
                    set.delete(path);
                }
                return xmomPath;
            })
            .filter(xmomPath => xmomPath);
    }


    restore(forceReselect = false) {
        this.selectedXmomPaths = this.restoreXmomPaths(this.xmomPaths, this.selectedPaths);
        this.expandedXmomPaths = this.restoreXmomPaths(this.xmomPaths, this.expandedPaths);

        const paths = Array.from(this.selectedPaths.values()).filter(p => p);
        const path = paths.join(', ');
        const newPath = this.selectedPath !== path;
        if (forceReselect || newPath) {
            this.selectedDepartment = path;
            this.selectedPath = path;
            this.xmomList.listMultiple(paths, !newPath);
        }
    }


    change(state: XMOMTreeItemState) {
        if (state.selected && !state.ctrl) {
            this.selectedPaths.clear();
        }

         
        (state.selected ? (Set.prototype.add) : Set.prototype.delete).call(this.selectedPaths, state.path);
        (state.expanded ? (Set.prototype.add) : Set.prototype.delete).call(this.expandedPaths, state.path);
         
        this.restore();
    }


    isDepartmentSelected(department: string): boolean {
        return this.selectedDepartment === department;
    }


    selectDepartment(department: string) {
        this.selectedDepartment = department;
        this.selectedPaths.clear();
        this.selectedPaths.add(department);
        this.restore();
        this.updateView();
    }


    hoverDepartment(department: string) {
        if (this.hoveredDepartment !== department) {
            this.hoveredDepartment = department;
            this.hoveredDepartmentLabel = FactoryComponent.DepartmentLabels[this.hoveredDepartment];
            this.updateView();
        }
    }
}
