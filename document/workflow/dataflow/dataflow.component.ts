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
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';

import { createSVGGroup, createSVGHorizontalCubicBezierPath, removeAllChildren } from '@zeta/base/draw';

import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Vector2 } from 'three';

import { DataConnectionType, XoConnection, XoConnectionArray } from '../../../xo/connection.model';
import { XoSetDataflowConnectionRequest } from '../../../xo/set-dataflow-connection-request.model';
import { XoWorkflow } from '../../../xo/workflow.model';
import { ComponentMappingService } from '../../component-mapping.service';
import { SelectionService } from '../../selection.service';
import { BranchSelectionService } from '../distinction/branch/branch-selection.service';
import { ModellingObjectComponent } from '../shared/modelling-object.component';
import { SelectableModellingObjectComponent } from '../shared/selectable-modelling-object.component';


class Flow {
    private readonly parent: SVGElement;
    private readonly _from: ModellingObjectComponent;
    private readonly _to: ModellingObjectComponent;
    private outlet: Vector2;
    private inlet: Vector2;
    private bgElement: SVGElement;
    private fgElement: SVGElement;
    private readonly _type: DataConnectionType;
    private readonly connection: XoConnection;
    private readonly readonly: boolean;
    private hasEventListeners: boolean;

    private readonly _offsetFrom: number;
    private readonly _offsetTo: number;

    private readonly doubleClickSubject = new Subject<void>();
    private readonly selectionSubject = new BehaviorSubject<boolean>(false);
    private readonly hoverSubject = new BehaviorSubject<boolean>(false);

    private readonly addButtons: ElementRef[];
    private readonly removeButtons: ElementRef[];
    private readonly tooltip: ElementRef;
    private static readonly OFFSET_WIDTH = 16;


    /**
     *
     * @param parent SVG element to draw onto
     * @param from Modelling object the flow comes from
     * @param to Modelling object the flow goes to
     * @param type Type of the flow (affects color and interaction)
     * @param offsetFrom Horizontal offset of flow start
     * @param offsetTo Horizontal offset of flow end
     * @param addButtons Buttons to use for adding a user connection
     * @param removeButtons Buttons to use for removing a user connection
     */
    constructor(parent: SVGElement, from: ModellingObjectComponent, to: ModellingObjectComponent, type: DataConnectionType, offsetFrom: number, offsetTo: number, addButtons: ElementRef[], removeButtons: ElementRef[], tooltip: ElementRef, connection: XoConnection, readonly: boolean) {
        this.parent = parent;
        this._from = from;
        this._to = to;
        this._type = type;
        this.addButtons = addButtons;
        this.removeButtons = removeButtons;
        this.tooltip = tooltip;
        this._offsetFrom = offsetFrom;
        this._offsetTo = offsetTo;
        this.connection = connection;
        this.readonly = readonly;

        this.update();
    }


    get doubleClicked(): Observable<void> {
        return this.doubleClickSubject.asObservable();
    }


    get selectedChange(): Observable<boolean> {
        return this.selectionSubject.asObservable();
    }


    get selected(): boolean {
        return this.selectionSubject.getValue();
    }

    /**
     * @description Calculates the x offset of two modelling components in the given svg element.
    */
    static getOffsetX(from: ModellingObjectComponent, to: ModellingObjectComponent): number {
        const outlet = from.outletPosition() || new Vector2();
        const inlet = to.inletPosition() || new Vector2();
        return outlet.x - inlet.x;
    }


    private updateSelectionState() {
        if (this.selected) {
            this.bgElement.classList.add('selected');
        } else {
            this.bgElement.classList.remove('selected');
        }
    }


    private updateButtonState() {
        const buttons = this.type === DataConnectionType.ambigue ? this.addButtons : (this.type === DataConnectionType.user) ? this.removeButtons : null;

        /** @todo make it better */
        if (buttons) {
            const halfSize = buttons[0].nativeElement.clientWidth / 2;
            buttons[0].nativeElement.style.left = (this.outlet.x - halfSize) + 'px';
            buttons[0].nativeElement.style.top = (this.outlet.y - halfSize) + 'px';
            buttons[1].nativeElement.style.left = (this.inlet.x - halfSize) + 'px';
            buttons[1].nativeElement.style.top = (this.inlet.y - halfSize) + 'px';
        }
    }


    select() {
        this.selectionSubject.next(true);
        this.updateSelectionState();

        const buttons = this.type === DataConnectionType.ambigue ? this.addButtons : (this.type === DataConnectionType.user) ? this.removeButtons : null;
        if (buttons && !this.readonly) {
            buttons[0].nativeElement.classList.add('visible');
            buttons[1].nativeElement.classList.add('visible');
        }
        this.updateButtonState();
    }

    hover() {
        this.tooltip.nativeElement.classList.add('visible');
        this.hoverSubject.next(true);

        if (!!this.outlet && !!this.inlet) {
            // only create a new flow line, if source and target are visible
            const outX = this.outlet.x + this._offsetFrom * Flow.OFFSET_WIDTH;
            const outY = this.outlet.y;
            const inX = this.inlet.x + this._offsetTo * Flow.OFFSET_WIDTH;
            const inY = this.inlet.y + 1;

            const [centerOfBezierPathX, centerOfBezierPathY] = [0.5 * inX + 0.5 * outX, 0.5 * inY + 0.5 * outY];
            this.tooltip.nativeElement.style.left = (centerOfBezierPathX - (this.tooltip.nativeElement.offsetWidth / 2)) + 'px';
            this.tooltip.nativeElement.style.top = (centerOfBezierPathY - (this.tooltip.nativeElement.offsetHeight / 2)) + 'px';
            this.tooltip.nativeElement.innerHTML = `${(this.from.getModel() as any).label} &rArr; ${(this.to.getModel() as any).label}`;
        }
    }

    endHover() {
        if (this.tooltip) {
            this.tooltip.nativeElement.classList.remove('visible');
            this.hoverSubject.next(false);
        }
    }


    unselect() {
        this.addButtons[0].nativeElement.classList.remove('visible');
        this.addButtons[1].nativeElement.classList.remove('visible');
        this.removeButtons[0].nativeElement.classList.remove('visible');
        this.removeButtons[1].nativeElement.classList.remove('visible');

        this.selectionSubject.next(false);
        this.updateSelectionState();
    }


    needsUpdate(): boolean {
        const equals = (v: Vector2, w: Vector2) => (v === w || (v && w && v.equals(w)));
        return !equals(this.outlet, this.from.outletPosition()) || !equals(this.inlet, this.to.inletPosition());
    }


    update() {
        this.outlet = this.from.outletPosition();
        this.inlet = (variable => {
            /** @todo make it better and differentiate on model-side if a variable is input or output of the workflow */
            const position = variable.inletPosition();
            if (!!position && position.y === 0 && variable.getModel().id && variable.getModel().id.startsWith('var-out')) {
                position.y += this.parent.parentElement.clientHeight;       // add height of SVG-element
                variable.inletPosition();
            }
            return position;
        })(this.to);


        // only create a new flow line, if source and target are visible
        if (this.outlet && this.inlet) {
            // only create a new flow line, if source and target are visible
            const outX = this.outlet.x + this._offsetFrom * Flow.OFFSET_WIDTH;
            const outY = this.outlet.y;
            const inX = this.inlet.x + this._offsetTo * Flow.OFFSET_WIDTH;
            const inY = this.inlet.y + 1;

            this.bgElement = createSVGHorizontalCubicBezierPath(this.parent, inX, inY, outX, outY, 36, 0, undefined, this.bgElement);
            this.fgElement = createSVGHorizontalCubicBezierPath(this.parent, inX, inY, outX, outY, 36, 0, undefined, this.fgElement);
            this.bgElement.classList.add('background-path');
            this.fgElement.classList.add('foreground-path');
            this.bgElement.classList.add(this._type.toString());
            this.fgElement.classList.add(this._type.toString());
            this.updateSelectionState();

            if (!this.hasEventListeners) {
                this.addEventListeners();
            }
        } else if (this.bgElement && this.bgElement.parentElement && this.fgElement && this.fgElement.parentElement) {
            // remove existing flow line
            this.bgElement.parentElement.removeChild(this.bgElement);
            this.fgElement.parentElement.removeChild(this.fgElement);
        }

        if (this.selected) {
            this.updateButtonState();
        }
    }


    private addEventListeners() {
        this.hasEventListeners = true;

        // Note that event listeners on old elements will be collected by the garbage collector
        if (this.type !== DataConnectionType.auto) {
            this.bgElement.addEventListener('click', (event: MouseEvent) => {
                event.stopPropagation();
                this.select();
            });
            this.bgElement.addEventListener('mouseover', (event: MouseEvent) => {
                event.stopPropagation();
                this.hover();
            });
            this.bgElement.addEventListener('mouseleave', (event: MouseEvent) => {
                event.stopPropagation();
                this.endHover();
            });
            this.bgElement.addEventListener('dblclick', (event: MouseEvent) => {
                event.stopPropagation();
                this.endHover();
                this.doubleClickSubject.next();
            });
        }
    }


    get from(): ModellingObjectComponent {
        return this._from;
    }


    get to(): ModellingObjectComponent {
        return this._to;
    }


    get type(): DataConnectionType {
        return this._type;
    }


    get branchId(): string {
        return this.connection ? this.connection.branchId : null;
    }
}



interface ConnectionObject {
    modellingObject: ModellingObjectComponent;
    connection: XoConnection;
}



@Component({
    selector: 'dataflow',
    templateUrl: './dataflow.component.html',
    styleUrls: ['./dataflow.component.scss'],
    standalone: false
})
export class DataflowComponent implements AfterViewInit, OnDestroy {

    private _workflow: XoWorkflow;
    private _dataflow: XoConnectionArray;
    private selectionSubscription: Subscription;
    private _selectedVariable: SelectableModellingObjectComponent = null;
    private selectedFlow: Flow = null;
    private animationFrameHandle: number;

    private readonly incomingAutoConnections = new Map<ModellingObjectComponent, Array<ConnectionObject>>();
    private readonly incomingAmbigueConnections = new Map<ModellingObjectComponent, Array<ConnectionObject>>();
    private readonly incomingUserConnections = new Map<ModellingObjectComponent, Array<ConnectionObject>>();
    private readonly outgoingAutoConnections = new Map<ModellingObjectComponent, Array<ConnectionObject>>();
    private readonly outgoingAmbigueConnections = new Map<ModellingObjectComponent, Array<ConnectionObject>>();
    private readonly outgoingUserConnections = new Map<ModellingObjectComponent, Array<ConnectionObject>>();

    @ViewChild('SVG', { static: false })
    private readonly element: ElementRef;
    private view: SVGElement;
    private flows: Flow[] = [];

    @ViewChild('addFrom', { static: false })
    private readonly addButtonFrom: ElementRef;
    @ViewChild('addTo', { static: false })
    private readonly addButtonTo: ElementRef;
    @ViewChild('removeFrom', { static: false })
    private readonly removeButtonFrom: ElementRef;
    @ViewChild('removeTo', { static: false })
    private readonly removeButtonTo: ElementRef;
    @ViewChild('tooltip', { static: false })
    private readonly tooltip: ElementRef;

    @Input()
    insideForeignRtc = false;

    @Output()
    readonly dataflowChange = new EventEmitter<XoSetDataflowConnectionRequest>();


    constructor(
        private readonly selectionService: SelectionService,
        private readonly componentMappingService: ComponentMappingService,
        private readonly branchSelection: BranchSelectionService,
        private readonly ngZone: NgZone
    ) {
    }


    ngAfterViewInit() {
        this.view = createSVGGroup(this.element.nativeElement);
    }


    ngOnDestroy() {
        this.selectionSubscription?.unsubscribe();
        if (this.animationFrameHandle) {
            cancelAnimationFrame(this.animationFrameHandle);
        }
    }


    private initDataflow() {
        if (this.workflow && this.dataflow) {
            this.workflow.clearVariableConnections();
            this.incomingAutoConnections.clear();
            this.incomingAmbigueConnections.clear();
            this.incomingUserConnections.clear();
            this.outgoingAutoConnections.clear();
            this.outgoingAmbigueConnections.clear();
            this.outgoingUserConnections.clear();

            const addValue = (map: Map<ModellingObjectComponent, Array<ConnectionObject>>, key: ModellingObjectComponent, value: ConnectionObject) => {
                const values = map.get(key);
                if (values) {
                    values.push(value);
                } else {
                    map.set(key, [value]);
                }
            };
            for (const connection of this.dataflow) {
                const source = this.componentMappingService.getComponentForId(this.workflow, connection.sourceId);
                const target = this.componentMappingService.getComponentForId(this.workflow, connection.targetId);

                if (source && target) {
                    switch (connection.type) {
                        case DataConnectionType.auto:
                            addValue(this.incomingAutoConnections, target, { modellingObject: source, connection: connection });
                            addValue(this.outgoingAutoConnections, source, { modellingObject: target, connection: connection });
                            break;
                        case DataConnectionType.ambigue:
                            addValue(this.incomingAmbigueConnections, target, { modellingObject: source, connection: connection });
                            addValue(this.outgoingAmbigueConnections, source, { modellingObject: target, connection: connection });
                            break;
                        case DataConnectionType.user:
                            addValue(this.incomingUserConnections, target, { modellingObject: source, connection: connection });
                            addValue(this.outgoingUserConnections, source, { modellingObject: target, connection: connection });
                            break;
                    }
                }
                // add connection to its target variables
                const variables = this.workflow.getVariablesById(connection.targetId);
                if (variables) {
                    variables.forEach(variable => variable.inConnections.push(connection));
                }
            }

            const loop = () => {
                this.ngZone.runOutsideAngular(
                    () => {
                        this.flows.forEach(flow => {
                            if (flow.needsUpdate()) {
                                flow.update();
                            }
                        });
                        this.animationFrameHandle = requestAnimationFrame(loop);
                    }
                );
            };
            if (this.animationFrameHandle) {
                cancelAnimationFrame(this.animationFrameHandle);
            }
            loop();
        }
    }


    get readonly(): boolean {
        return !!this.workflow && this.workflow.readonly || this.insideForeignRtc;
    }


    get selectedVariable(): SelectableModellingObjectComponent {
        return this._selectedVariable;
    }


    set selectedVariable(value: SelectableModellingObjectComponent) {
        this.flows = [];
        if (this.selectedFlow) {
            this.selectedFlow.unselect();
        }
        this.selectedFlow = null;
        this._selectedVariable = value;

        let numFlowsIn = 0;
        let currentFlowIn = 0;
        let numFlowsOut = 0;
        let currentFlowOut = 0;

        const drawConnections = (items: Array<ConnectionObject>, directionIn: boolean, type: DataConnectionType) => {
            if (items.length > 0) {
                for (const item of items) {
                    // if a branch is selected, don't show connections belonging to another branch
                    const branchId = this.branchSelection.selectedObject ? this.branchSelection.selectedObject.getModel().id : null;
                    if (!!branchId && !!item.connection.branchId && branchId !== item.connection.branchId) {
                        continue;
                    }

                    // create a flow element for each
                    let flow: Flow;
                    if (directionIn) {
                        const offsetTo = currentFlowIn - (numFlowsIn - 1) / 2;
                        flow = new Flow(this.view, item.modellingObject, this.selectedVariable, type, 0, offsetTo, [this.addButtonFrom, this.addButtonTo], [this.removeButtonFrom, this.removeButtonTo], this.tooltip, item.connection, this.readonly);
                        currentFlowIn++;
                    } else {
                        const offsetFrom = currentFlowOut - (numFlowsOut - 1) / 2;
                        flow = new Flow(this.view, this.selectedVariable, item.modellingObject, type, offsetFrom, 0, [this.addButtonFrom, this.addButtonTo], [this.removeButtonFrom, this.removeButtonTo], this.tooltip, item.connection, this.readonly);
                        currentFlowOut++;
                    }
                    this.flows.push(flow);

                    flow.selectedChange.subscribe(
                        selected => {
                            if (selected) {
                                // unselect all other flows
                                this.flows.filter(other => other !== flow).forEach(other => other.unselect());
                                this.selectedFlow = flow;
                            }
                        }
                    );
                    flow.doubleClicked.subscribe(
                        () => {
                            if (flow.type === DataConnectionType.ambigue) {
                                this.addConnection();
                            }
                        }
                    );
                }
            }
        };

        if (this._selectedVariable) {
            const incomingAuto = this.incomingAutoConnections.get(this._selectedVariable) || [];
            const incomingAmbigue = this.incomingAmbigueConnections.get(this._selectedVariable) || [];
            const incomingUser = this.incomingUserConnections.get(this._selectedVariable) || [];
            const outgoingAuto = this.outgoingAutoConnections.get(this._selectedVariable) || [];
            const outgoingAmbigue = this.outgoingAmbigueConnections.get(this._selectedVariable) || [];
            const outgoingUser = this.outgoingUserConnections.get(this._selectedVariable) || [];

            numFlowsIn = incomingAuto.length + incomingAmbigue.length + incomingUser.length;
            numFlowsOut = outgoingAuto.length + outgoingAmbigue.length + outgoingUser.length;

            drawConnections(this.sortConnections(incomingAuto), true, DataConnectionType.auto);
            drawConnections(this.sortConnections(incomingAmbigue), true, DataConnectionType.ambigue);
            drawConnections(this.sortConnections(incomingUser), true, DataConnectionType.user);
            drawConnections(this.sortConnections(outgoingAuto), false, DataConnectionType.auto);
            drawConnections(this.sortConnections(outgoingAmbigue), false, DataConnectionType.ambigue);
            drawConnections(this.sortConnections(outgoingUser), false, DataConnectionType.user);
        }
    }


    /**
     * @param connections Array of ConnectionObjects to sort
     * @description Groups ConnectionObjects based on their input area and sorts them by their x offset.
     * @returns Sorted ConnectionObjects
     */
    private sortConnections(connections: ConnectionObject[]) {
        // Group targets by area where the key is the id of the area
        const groups: { [key: string]: ConnectionObject[] } = {};
        connections.forEach(connection => {
            const target = connection.modellingObject;
            if (groups[target.getModel().parent.id] === undefined) {
                groups[target.getModel().parent.id] = [connection];
            } else {
                groups[target.getModel().parent.id].push(connection);
            }
        });

        // Sort group items based on x offset and push them into an array
        const sortedGroups: ConnectionObject[][] = [];
        Object.keys(groups).forEach(group => {
            sortedGroups.push(
                groups[group].sort((a, b) => (
                    Flow.getOffsetX(this.selectedVariable, b.modellingObject) -
                    Flow.getOffsetX(this.selectedVariable, a.modellingObject)
                ))
            );
        });

        // Sort groups based on x offset and flatten it into the result
        const result: ConnectionObject[] = [];
        sortedGroups
            .sort((groupA, groupB) => {
                // Calculate the offset of each member of both groups
                const offsetsGroupA = groupA.map(a => Flow.getOffsetX(this.selectedVariable, a.modellingObject));
                const offsetsGroupB = groupB.map(b => Flow.getOffsetX(this.selectedVariable, b.modellingObject));

                // Calculate the average offset of both groups
                const averageA = offsetsGroupA.reduce((p, c) => p += c) / offsetsGroupA.length;
                const averageB = offsetsGroupB.reduce((p, c) => p += c) / offsetsGroupB.length;

                return averageB - averageA;
            })
            .forEach(group => result.push(...group));
        return result;
    }


    @Input()
    set dataflow(dataflow: XoConnectionArray) {
        if (dataflow !== this._dataflow) {
            this._dataflow = dataflow;
            this.initDataflow();
        }
    }


    get dataflow(): XoConnectionArray {
        return this._dataflow;
    }


    dataflowsVisible(): boolean {
        const svg = this.element && this.element.nativeElement;
        return !!svg && !!svg.childNodes[0] && svg.childNodes[0].childNodes.length > 0;
    }


    addConnection() {
        this.changeConnection(DataConnectionType.user);
    }


    removeConnection() {
        this.changeConnection(DataConnectionType.none);
    }


    private changeConnection(type: DataConnectionType) {
        if (!this.readonly) {
            const branchId = this.selectedFlow.branchId;
            const request = new XoSetDataflowConnectionRequest(undefined, this.selectedFlow.from.getModel().id, this.selectedFlow.to.getModel().id, type, branchId);
            this.dataflowChange.emit(request);
        }
    }


    @Input()
    set workflow(value: XoWorkflow) {
        if (value && value !== this._workflow) {
            this._workflow = value;

            // subscribe to selection changes
            this.selectionSubscription?.unsubscribe();
            this.selectionSubscription = this.selectionService.selectionChange.subscribe(selected => {
                if (this.view) {
                    removeAllChildren(this.view);
                }
                this.selectedVariable = selected;
            });

            this.initDataflow();
        }
    }


    get workflow(): XoWorkflow {
        return this._workflow;
    }
}
