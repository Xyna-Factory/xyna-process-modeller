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
import { AfterViewInit, Component, ElementRef, HostListener, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { GraphicallyRepresented } from '@zeta/base';
import { createSVGCircle, createSVGGroup, createSVGHorizontalCubicBezierPath, createSVGText, createSVGVerticalCubicBezierPath } from '@zeta/base/draw';
import { filter, forkJoin, take } from 'rxjs';
import { Vector2 } from 'three';



export interface Literal {
    text: string;
}

export interface FlowDefinition {
    source: GraphicallyRepresented<Element>;
    destination: GraphicallyRepresented<Element>;
    description?: string;
}


export enum FlowDirection {
    horizontally,
    vertically
}


// TODO merge with DataFlowComponent

export class Flow {
    private readonly parent: SVGElement;
    private readonly _flowDefinition: FlowDefinition;
    private outlet = new Vector2();
    private inlet = new Vector2();
    private path: SVGElement;
    private description: SVGElement;
    private endCircle: SVGElement;

    private _offset: Vector2;
    private readonly _flowDirection: FlowDirection = FlowDirection.horizontally;

    /**
     *
     * @param parent SVG element to draw onto
     * @param definition Defines the flow's source and destination
     * @param flowDirection Start and end of flow will direct in `flowDirection`
     * @param offset Flow's offset
     */
    constructor(parent: SVGElement, flowDefinition: FlowDefinition, flowDirection: FlowDirection, offset: Vector2) {
        this.parent = parent;
        this._flowDefinition = flowDefinition;
        this._flowDirection = flowDirection;
        this._offset = offset;

        // wait with the update until each node's graphical representation is there
        console.log('find graphical reps');

        forkJoin([
            this._flowDefinition?.source,
            this._flowDefinition?.destination
        ].filter(graphic => !!graphic)
            .map(graphic => graphic.graphicalRepresentationChange())
            .map(graphic => {
                console.log('after fork join');
                return graphic.pipe(
                    filter(g => {
                        if (!g) {
                            console.warn('there is one g unset');
                        }
                        return !!g;
                    }), // each graphical representation has to be defined
                    take(1)
                );
            })
        ).subscribe(() => { console.log('call update flow'); this.update(); },
        error => console.warn('error find graph reps, ' + error));
    }


    update() {
        const toRect   = this._flowDefinition?.destination?.graphicalRepresentation?.getBoundingClientRect();
        const fromRect = this._flowDefinition?.source?.graphicalRepresentation?.getBoundingClientRect()
            ?? (toRect
                // use an offsetted toRect if there's no source
                ? new DOMRect(toRect.x + toRect.width + 20, toRect.y, toRect.width, toRect.height)
                : null);

        if (!fromRect || !toRect) {
            return;
        }

        console.log(`from: (${Math.round(fromRect.x)}, ${Math.round(fromRect.y)})\tto: (${Math.round(toRect.x)}, ${Math.round(toRect.y)})`);

        // TODO implement an algorithm that automatically decides which edges to connect in which direction
        if (this._flowDirection === FlowDirection.horizontally) {
            if (Math.abs(fromRect.left - toRect.right) < Math.abs(fromRect.right - toRect.left)) {
                this.outlet.setX(toRect.right);
                this.outlet.setY(toRect.top + toRect.height / 2);
                this.inlet.setX(fromRect.left);
                this.inlet.setY(fromRect.top + fromRect.height / 2);
            } else {
                this.outlet.setX(fromRect.right);
                this.outlet.setY(fromRect.top + fromRect.height / 2);
                this.inlet.setX(toRect.left);
                this.inlet.setY(toRect.top + toRect.height / 2);
            }
            this.outlet = this.outlet.add(this.offset);
            this.inlet  = this.inlet.add(this.offset);
        } else {
            // TODO
        }

        const outX = this.outlet.x;
        const outY = this.outlet.y;
        const inX = this.inlet.x;
        const inY = this.inlet.y;

        // remark: Actually modifies existing DOM element instead of creating a new one
        this.path = this._flowDirection === FlowDirection.horizontally
            ? createSVGVerticalCubicBezierPath(this.parent, inX, inY, outX, outY, 4, 0, undefined, this.path)
            : createSVGHorizontalCubicBezierPath(this.parent, inX, inY, outX, outY, 4, 0, undefined, this.path);
        this.path.classList.add('path');


        this.description?.remove();
        this.endCircle?.remove();
        if (this._flowDefinition.description) {
            this.endCircle = createSVGCircle(this.parent, inX, inY, 4);
            this.description = createSVGText(this.parent, inX + 4, inY, this._flowDefinition.description, 12, 'left');
        }
    }


    destroy() {
        this.path?.remove();
        this.description?.remove();
        this.endCircle?.remove();
    }


    needsUpdate(): boolean {
        return true;
    }


    get offset(): Vector2 {
        return this._offset;
    }


    set offset(value: Vector2) {
        this._offset = value;
        this.update();
    }
}



@Component({
    selector: 'flow-canvas',
    templateUrl: './flow-canvas.component.html',
    styleUrls: ['./flow-canvas.component.scss']
})
export class FlowCanvasComponent implements AfterViewInit, OnDestroy {

    @ViewChild('SVG', {static: false})
    private readonly element: ElementRef;
    private view: SVGElement;

    private _flowDefinitions: FlowDefinition[];
    private _flows: Flow[] = [];

    private frameRequestCallback: FrameRequestCallback;
    private animationFrameHandle: number;

    private resizeObserver: ResizeObserver;

    constructor(private readonly ngZone: NgZone) {
    }


    ngAfterViewInit() {
        this.view = createSVGGroup(this.element.nativeElement);
        this.initFlow();
    }


    ngOnDestroy() {
        if (this.animationFrameHandle) {
            cancelAnimationFrame(this.animationFrameHandle);
        }
        this.resizeObserver?.unobserve(this.element.nativeElement);
        this._flows.forEach(flow => flow.destroy());
    }


    @Input()
    set flowDefinitions(definitions: FlowDefinition[]) {
        // TODO build flows here
        this._flowDefinitions = definitions;
        if (definitions) {
            this.initFlow();
        }
    }


    protected initFlow() {
        const parentOffset = (): Vector2 => {
            const parentOffsetRect = this.element.nativeElement.getBoundingClientRect();
            const offset = new Vector2(-parentOffsetRect.left, -parentOffsetRect.top);
            console.log(`offset: (${Math.round(offset.x)}, ${Math.round(offset.y)})`);
            return offset;
        };

        if (this._flowDefinitions && this.view) {
            const offset = parentOffset();
            this._flows.forEach(flow => flow.destroy());
            this._flows = this._flowDefinitions.map(definition => new Flow(this.view, definition, FlowDirection.horizontally, offset));

            if (this.animationFrameHandle) {
                cancelAnimationFrame(this.animationFrameHandle);
            }
            this.frameRequestCallback = () => {
                this.loop();
            };

            this.resizeObserver = new ResizeObserver(() => {
                console.log('resize');
                const o = parentOffset();
                this._flows.forEach(flow => flow.offset = o);
            });
            this.resizeObserver.observe(this.element.nativeElement);
        }
    }


    protected loop() {
        this.ngZone.runOutsideAngular(
            () => {
                console.log('loop');
                this._flows.forEach(flow => {
                    if (flow.needsUpdate()) {
                        flow.update();
                    }
                });
                this.animationFrameHandle = requestAnimationFrame(this.frameRequestCallback);
            }
        );
    }


    @HostListener('click')
    onClick() {
        this._flows.forEach(flow => {
            if (flow.needsUpdate()) {
                flow.update();
            }
        });
    }
}
