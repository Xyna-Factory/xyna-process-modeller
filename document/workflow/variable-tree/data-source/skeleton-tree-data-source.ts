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
import { ApiService, FullQualifiedName, RuntimeContext, XoDescriber, XoDescriberCache, XoStructureArray, XoStructureComplexField, XoStructureField, XoStructureObject, XoStructurePrimitive, XoStructureType } from '@zeta/api';
import { BehaviorSubject, Observable, concat, filter, finalize, first, map, switchMap } from 'rxjs';
import { RecursiveStructure } from '@pmod/xo/expressions/RecursiveStructurePart';
import { XoVariable } from '@pmod/xo/variable.model';
import { ArraySkeletonTreeNode, ObjectSkeletonTreeNode, PrimitiveSkeletonTreeNode, SkeletonTreeNode } from './skeleton-tree-node';


export interface TreeNodeFactory {
    createNodeFromStructure(structure: XoStructureField): SkeletonTreeNode;
    createPrimitiveNode(structure: XoStructurePrimitive): PrimitiveSkeletonTreeNode;
    createComplexNode(structure: XoStructureComplexField): ObjectSkeletonTreeNode;
    createArrayNode(structure: XoStructureArray): ArraySkeletonTreeNode;
    getNewChildren(structure: XoStructureObject): Observable<XoStructureField[]>;
    getSubtypes(structure: XoStructureObject): Observable<XoStructureType[]>;
}


export interface TreeNodeObserver {
    nodeChange(node: SkeletonTreeNode): void;
}


export class VariableDescriber implements XoDescriber {

    constructor(public rtc: RuntimeContext, public fqn: FullQualifiedName, public isList: boolean, public label: string) {
    }
    ident?: string;

    compare(variable: XoVariable): boolean {
        if (!this.fqn?.equals(FullQualifiedName.decode(variable.$fqn))) {
            return false;
        }
        const varRTC = variable.$rtc.runtimeContext();
        if (!this.rtc?.equals(varRTC)) {
            return false;
        }
        if (this.isList !== variable.isList) {
            return false;
        }
        if (this.label !== variable.label) {
            return false;
        }
        return true;
    }
}


export interface StructureProcessPair {
    structure: RecursiveStructure;
    postProcess: (node: SkeletonTreeNode) => Observable<SkeletonTreeNode>;
}


export interface SkeletonTreeDataSourceObserver {
    nodeChange(dataSource: SkeletonTreeDataSource, node: SkeletonTreeNode): void;
}


/**
 * Data Source for a tree made of a data type structure.
 * In contrast to the StructureTreeDataSource, this data source does not hold instances of the structured data types but
 * only represents the data type's skeleton itself
 */
export class SkeletonTreeDataSource implements TreeNodeFactory, TreeNodeObserver {
    private readonly _root$ = new BehaviorSubject<SkeletonTreeNode>(null);
    private initialize = true;

    /**
     * @param rootIndex Index of root variable in outer context
     */
    constructor(protected describer: VariableDescriber, protected api: ApiService, protected rtc: RuntimeContext, protected observer: SkeletonTreeDataSourceObserver, protected rootIndex: number = undefined, private readonly structureCache?: XoDescriberCache<XoStructureObject>) {
    }


    refresh() {
        this.api.getStructure(this.rtc, [this.describer], this.structureCache).get(this.describer).pipe(first()).subscribe(structure => this.setStructure(structure));
    }


    setStructure(structure: XoStructureObject) {
        structure.label = this.describer.label;
        let node;
        if (this.describer.isList) {
            node = this.createArrayNode(XoStructureArray.fromObject(structure));
            node.sourceIndex = this.rootIndex;
        } else {
            node = this.createComplexNode(structure);
            node.sourceIndex = this.rootIndex;
        }
        this._root$.next(node);
    }


    get root$(): Observable<SkeletonTreeNode> {
        return this._root$.asObservable();
    }


    get root(): SkeletonTreeNode {
        return this._root$.value;
    }


    get variableDescriber(): VariableDescriber {
        return this.describer;
    }

    /**
     * Traverses the tree along with the variable. Wait on setting root.
     * Modifies the tree (changes selected subtype or adds array entries) if necessary/possible.
     */
    processStructure(pairs: StructureProcessPair[]): Observable<SkeletonTreeNode> {

        return concat(...pairs.map(
            pair => this.root$.pipe(
                filter(root => !!root),
                first(),
                switchMap(root => root.match(pair.structure.getRecursiveStructure(), this.initialize)),
                switchMap(pair.postProcess)
            ))).pipe(
                finalize(() => this.initialize = false)
            );
    }


    /**
     * Clears all `marked` states of all nodes
     */
    clearMarks() {
        this.root$.pipe(
            filter(root => !!root),
            first()
        ).subscribe(root => root.unmarkRecursively());
    }


    /* ***   Tree Node Factory   *** */

    createNodeFromStructure(structure: XoStructureField): SkeletonTreeNode {
        let node: SkeletonTreeNode = null;
        if (structure instanceof XoStructurePrimitive) {
            node = this.createPrimitiveNode(structure);
        } else if (structure instanceof XoStructureObject) {
            node = this.createComplexNode(structure);
        } else if (structure instanceof XoStructureArray) {
            node = this.createArrayNode(structure);
        }
        return node;
    }


    createPrimitiveNode(structure: XoStructurePrimitive): PrimitiveSkeletonTreeNode {
        return new PrimitiveSkeletonTreeNode(structure, this, new Set<TreeNodeObserver>([this]));
    }


    createComplexNode(structure: XoStructureObject): ObjectSkeletonTreeNode {
        return new ObjectSkeletonTreeNode(structure, this, new Set<TreeNodeObserver>([this]));
    }


    createArrayNode(structure: XoStructureArray): ArraySkeletonTreeNode {
        return new ArraySkeletonTreeNode(structure, this, new Set<TreeNodeObserver>([this]));
    }


    getNewChildren(structure: XoStructureObject): Observable<XoStructureField[]> {
        const describer = <XoDescriber>{ rtc: structure.typeRtc, fqn: structure.typeFqn };
        return this.api.getStructure(structure.typeRtc, [describer], this.structureCache).get(describer).pipe(
            first(),
            map(enrichedStructure => {
                const newChildren = enrichedStructure.children.filter(child => !structure.children.find(oldChild => {
                    const oldChildWithoutParent = oldChild.clone(true);
                    oldChildWithoutParent.parent = null;
                    child.parent = null;
                    return child.equals(oldChildWithoutParent);
                }));
                return newChildren;
            })
        );
    }


    getSubtypes(structure: XoStructureObject): Observable<XoStructureType[]> {
        const describer = <XoDescriber>{ rtc: structure.typeRtc, fqn: structure.typeFqn };
        return this.api.getSubtypes(structure.typeRtc, [describer]).get(describer).pipe(first());
    }


    nodeChange(node: SkeletonTreeNode): void {
        this.observer?.nodeChange(this, node);
    }
}
