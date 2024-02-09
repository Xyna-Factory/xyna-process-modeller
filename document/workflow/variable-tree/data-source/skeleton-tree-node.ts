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
import { FullQualifiedName, Xo, XoJson, XoStructureArray, XoStructureField, XoStructureObject, XoStructurePrimitive, XoStructureType } from '@zeta/api';
import { GraphicallyRepresented } from '@zeta/base';
import { BehaviorSubject, Observable, filter, first, forkJoin, map, of, switchMap } from 'rxjs';
import { Draggable } from '../../shared/drag-and-drop/mod-drag-and-drop.service';
import { RecursiveStructurePart } from '@pmod/xo/expressions/RecursiveStructurePart';
import { TreeNodeFactory, TreeNodeObserver } from './skeleton-tree-data-source';

export abstract class SkeletonTreeNode implements GraphicallyRepresented<Element>, Draggable {
    private _structure: XoStructureField;
    private _xfl: string;
    private _isList: boolean;
    collapsible = true;
    private _collapsed = true;

    /** Node is marked for some reason and can be rendered differently than an unmarked node */
    private readonly _marked$ = new BehaviorSubject<boolean>(false);
    private readonly _selected$ = new BehaviorSubject<boolean>(false);

    private readonly _graphicalRepresentation$ = new BehaviorSubject<Element>(null);

    protected _children: SkeletonTreeNode[] = [];
    protected _parent: SkeletonTreeNode;

    constructor(structure: XoStructureField, protected nodeFactory: TreeNodeFactory, protected nodeObservers: Set<TreeNodeObserver> = new Set<TreeNodeObserver>()) {
        this.setStructure(structure);
    }


    getStructure(): XoStructureField {
        return this._structure;
    }


    protected setStructure(structure: XoStructureField) {
        this._structure = structure;
    }


    protected changeStructureType(type: XoStructureType) {
        this._structure.typeFqn = type.typeFqn;
        this._structure.typeRtc = type.typeRtc;
        this._structure.typeLabel = type.typeLabel;
    }


    get collapsed(): boolean {
        return this._collapsed;
    }


    collapse() {
        if (!this.collapsed) {
            this._collapsed = true;
            this.notifyObservers();
        }
    }


    uncollapse() {
        if (this.collapsible && this.collapsed) {
            this._collapsed = false;
            this.notifyObservers();
        }
    }


    uncollapseRecursivelyUpwards() {
        this.parent?.uncollapseRecursivelyUpwards();
        this.parent?.uncollapse();
    }


    get isList(): boolean {
        return this._isList;
    }


    set isList(value: boolean) {
        this._isList = value;
    }


    get markedChange(): Observable<boolean> {
        return this._marked$.asObservable();
    }


    get marked(): boolean {
        return this._marked$.value;
    }


    set marked(value: boolean) {
        this._marked$.next(value);

        // mark parent if all children are marked
        if (this.marked && !this.parent?.marked) {
            this.parent?.markIfChildrenMarked();
        }
    }


    markRecursively(mark = true) {
        this.marked = mark;
        this.children.forEach(child => child.markRecursively(mark));
    }


    unmarkRecursively() {
        this.markRecursively(false);
    }


    markIfChildrenMarked() {
        // all children marked
        if (this.children.length > 0 && !this.children.some(child => !child.marked)) {
            this.marked = true;
        }
    }


    get selectedChange(): Observable<boolean> {
        return this._selected$.asObservable();
    }


    get selected(): boolean {
        return this._selected$.value;
    }


    set selected(value: boolean) {
        if (value !== this.selected) {
            this._selected$.next(value);
        }
    }


    destroy() {
        this.selected = false;
    }


    get name(): string {
        return this.getStructure().name;
    }


    get label(): string {
        return this.getStructure().label ?? this.getStructure().name;
    }


    get typeLabel(): string {
        return this.getStructure().typeLabel;
    }


    get children(): SkeletonTreeNode[] {
        return this._children;
    }


    get parent(): SkeletonTreeNode {
        return this._parent;
    }


    set parent(value: SkeletonTreeNode) {
        this._parent = value;
    }


    get xfl(): string {
        return this._xfl;
    }


    set xfl(xfl: string) {
        this._xfl = xfl;
    }


    addObserver(observer: TreeNodeObserver) {
        this.nodeObservers.add(observer);
    }

    removeObserver(observer: TreeNodeObserver) {
        this.nodeObservers.delete(observer);
    }

    notifyObservers() {
        this.nodeObservers?.forEach(observer => observer.nodeChange(this));
    }


    /**
     * Traverses a structure and looks for a node that matches `path`
     *
     * @param path Path to traverse structure.
     * @returns Observable will complete after firt value. Return matching `Node` or undefined.
     */
    abstract match(path: RecursiveStructurePart): Observable<SkeletonTreeNode>;


    /**
     * Returns XFL expression of this node up to its root
     */
    toXFL(): string {
        const prefix = this.parent?.toXFL() ?? '';
        const separator: string = this.parent?.isList ? '' : '.';
        return (prefix.length > 0 ? prefix + separator : '') + this.getXFLExpression();
    }


    /**
     * Returns XFL expression of this node
     * @remark To be overridden by each node
     */
    protected getXFLExpression(): string {
        return this.xfl ?? '';
    }


    /**
     * @inheritdoc
     */
    get graphicalRepresentation(): Element {
        return this._graphicalRepresentation$.value;
    }

    set graphicalRepresentation(value: Element) {
        if (this.graphicalRepresentation !== value) {
            this._graphicalRepresentation$.next(value);
        }
    }

    graphicalRepresentationChange(): Observable<Element> {
        return this._graphicalRepresentation$.asObservable();
    }


    /* ***   Draggable   *** */


    get id(): string {
        return this.toXFL();
    }

    get fqn(): FullQualifiedName {
        return this.getStructure().typeFqn ?? FullQualifiedName.fromPrimitive('String');
    }

    encode(into?: XoJson, parent?: Xo): XoJson {
        return { $meta: { fqn: this.fqn.encode(), rtc: this.getStructure().typeRtc?.encode() ?? undefined } };
    }
}


export class PrimitiveSkeletonTreeNode extends SkeletonTreeNode {

    constructor(structure: XoStructurePrimitive, nodeFactory: TreeNodeFactory, nodeObservers: Set<TreeNodeObserver>) {
        super(structure, nodeFactory, nodeObservers);
        this.collapsible = false;
    }

    getStructure(): XoStructurePrimitive {
        return super.getStructure() as XoStructurePrimitive;
    }

    match(path: RecursiveStructurePart): Observable<SkeletonTreeNode> {
        if (path.path === this.getXFLExpression()) {
            return of(this);
        }
        return of(undefined);
    }

    /**
     * @inheritdoc
     */
    protected getXFLExpression(): string {
        return this.xfl ?? this.getStructure()?.name ?? '';
    }
}


export class ComplexSkeletonTreeNode extends SkeletonTreeNode {
    private readonly _subtypes = new BehaviorSubject<XoStructureType[]>(null);
    private _sourceIndex: number;
    private readonly _markForCheckChildren = new BehaviorSubject<boolean>(true);
    private runningUpdateChildren: Observable<boolean> = undefined;


    constructor(structure: XoStructureObject, protected nodeFactory: TreeNodeFactory, protected nodeObservers: Set<TreeNodeObserver> = new Set<TreeNodeObserver>()) {
        super(structure, nodeFactory, nodeObservers);
        this.nodeFactory.getSubtypes(this.getStructure()).pipe(
            first()
        ).subscribe(subtypes => this._subtypes.next(subtypes));
    }

    getStructure(): XoStructureObject {
        return super.getStructure() as XoStructureObject;
    }


    protected setStructure(structure: XoStructureObject) {
        structure.children = [];
        super.setStructure(structure);
    }


    uncollapse() {
        this.updateChildren().subscribe();
        super.uncollapse();
    }


    updateChildren(): Observable<boolean> {

        return this.markForCheckChildren.pipe(
            first(),
            switchMap(markForCheck => {
                if (markForCheck) {
                    this.runningUpdateChildren = this.runningUpdateChildren ??
                        this.nodeFactory.getNewChildren(this.getStructure()).pipe(
                            first(),
                            map(newChildren => {
                                this.getStructure().addChildren(...newChildren);

                                // here comes the whole structure including children and their types
                                // build all node children here and give them their describer
                                newChildren.forEach(field => {
                                    const node = this.nodeFactory.createNodeFromStructure(field);
                                    if (node) {
                                        this._children.push(node);
                                        node.parent = this;
                                    }
                                });
                                this.notifyObservers();
                                this._markForCheckChildren.next(false);
                                this.runningUpdateChildren = undefined;
                                return true;
                            })
                        );
                    return this.runningUpdateChildren;
                }
                return of(false);
            })
        );
    }


    private setSubtypeStructure(type: XoStructureType): Observable<boolean> {

        this.changeStructureType(type);
        this._markForCheckChildren.next(true);
        return this.updateChildren();
    }

    get markForCheckChildren(): Observable<boolean> {
        return this._markForCheckChildren.asObservable();
    }


    get sourceIndex(): number {
        return this._sourceIndex;
    }


    set sourceIndex(value: number) {
        this._sourceIndex = value;
    }


    match(path: RecursiveStructurePart): Observable<SkeletonTreeNode> {
        if (this.getXFLExpression() !== path.path) {
            return of(undefined);
        }

        const askChildrenForMatch = () => forkJoin(this.children.map(child => child.match(path.child))).pipe(
            map(matches => matches.find(node => !!node) ?? this)
        );

        const continueMatching = () => path.child ? askChildrenForMatch() : of(this);

        if (path.fqn && path.fqn !== this.getStructure().typeFqn.encode(false)) {
            // wait for subtypes, to be initialized
            return this._subtypes.pipe(
                filter(types => !!types),
                first(),
                map(types => types.find(subType => path.fqn === subType.typeFqn.encode(false))),
                // if this node was never been uncollapsed, children need to be initialized.
                switchMap(type => type ? this.setSubtypeStructure(type) : this.updateChildren()),
                // All structures ready. It can continue to match.
                switchMap(() => continueMatching())
            );
        }
        return this.updateChildren().pipe(
            // wait for updateChildren and ask recursivly children afterwards for matching node.
            switchMap(() => continueMatching())
        );
    }


    protected getXFLExpression(): string {
        return this.sourceIndex !== undefined
            ? `%${this.sourceIndex}%`
            : this.xfl ?? this.getStructure()?.name ?? '';
    }
}


export class ArraySkeletonTreeNode extends SkeletonTreeNode {

    private _sourceIndex: number;

    constructor(structure: XoStructureArray, nodeFactory: TreeNodeFactory, nodeObservers: Set<TreeNodeObserver>) {
        super(structure, nodeFactory, nodeObservers);
        this.isList = true;
    }

    getStructure(): XoStructureArray {
        return super.getStructure() as XoStructureArray;
    }


    get sourceIndex(): number {
        return this._sourceIndex;
    }


    set sourceIndex(value: number) {
        this._sourceIndex = value;
    }


    match(path: RecursiveStructurePart): Observable<SkeletonTreeNode> {
        if (this.getXFLExpression() !== path.path) {
            return of(undefined);
        }

        if (!path.child) {
            return of(this);
        }

        const createMatchingChild = (childPath: RecursiveStructurePart): Observable<SkeletonTreeNode> => {
            const matchingChild = this.nodeFactory.createNodeFromStructure(this.getStructure().add());
            matchingChild.xfl = childPath.path;
            matchingChild.getStructure().label = childPath.path;
            this._children.push(matchingChild);
            matchingChild.parent = this;
            this.notifyObservers();
            return matchingChild.match(childPath);
        };

        // forkJoin errors, if incoming list is empty. If we have no children, we want to create a new one.
        const foundMatchingChildren = this.children.length > 0 ? this.children.map(child => child.match(path.child)) : [of(undefined)];
        return forkJoin(foundMatchingChildren).pipe(
            map(matches => matches.find(node => !!node)),
            // If no child match, create a new child, that will match. Because the matching of a potential new child is asynchronously, switchMap is needed.
            switchMap(match => match ? of(match) : createMatchingChild(path.child))
        );
    }


    protected getXFLExpression(): string {
        return this.sourceIndex !== undefined
            ? `%${this.sourceIndex}%`
            : this.xfl ?? this.getStructure()?.name ?? '';
    }
}
