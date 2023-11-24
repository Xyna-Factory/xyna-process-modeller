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
import { ApiService, RuntimeContext, XoDescriber, XoStructureArray, XoStructureComplexField, XoStructureField, XoStructureObject, XoStructurePrimitive, XoStructureType } from '@zeta/api';
import { BehaviorSubject, Observable, first } from 'rxjs';


export interface TreeNodeFactory {
    createNodeFromStructure(structure: XoStructureField): SkeletonTreeNode;
    createPrimitiveNode(structure: XoStructurePrimitive): PrimitiveSkeletonTreeNode;
    createComplexNode(structure: XoStructureComplexField): ComplexSkeletonTreeNode;
    createArrayNode(structure: XoStructureArray): ArraySkeletonTreeNode;
    createArrayEntryNode(structure: XoStructureArray): ArrayEntrySkeletonTreeNode;
}



export class SkeletonTreeNode {
    private _structure: XoStructureField;

    protected _children: SkeletonTreeNode[] = [];

    constructor(structure: XoStructureField, protected nodeFactory: TreeNodeFactory) {
        this.setStructure(structure);
    }


    getStructure(): XoStructureField {
        return this._structure;
    }


    setStructure(structure: XoStructureField) {
        this._structure = structure;
    }


    get name(): string {
        return this.getStructure().name;
    }


    get label(): string {
        return this.getStructure().label?.length === 0 ? this.getStructure().name : this.getStructure().label;
    }


    get typeLabel(): string {
        return this.getStructure().typeLabel;
    }


    get children(): SkeletonTreeNode[] {
        return this._children;
    }


        // TODO: pt. 2 to update this node should be made in a subclass
        // TODO: use existing cache from other mapping variables

    /*
    refreshStructure() {
        this.api.getStructure(this.rtc, [this.describer]).get(this.describer).pipe(first()).subscribe(structure => this.setStructure(structure));
    }
    */
}



export class PrimitiveSkeletonTreeNode extends SkeletonTreeNode {

    getStructure(): XoStructurePrimitive {
        return super.getStructure() as XoStructurePrimitive;
    }


    getName(): string {
        return this.getStructure()?.label ?? this.getStructure()?.name ?? 'undefined';
    }
}



export class ComplexSkeletonTreeNode extends SkeletonTreeNode {
    private _subtypes: XoStructureType[] = [];


    getStructure(): XoStructureObject {
        return super.getStructure() as XoStructureObject;
    }


    setStructure(structure: XoStructureField): void {
        super.setStructure(structure);

        // here comes the whole structure including children and their types
        // build all node children here and give them their describer

        this._children.splice(0);
        this.getStructure().children.forEach(field => {
            const node = this.nodeFactory.createNodeFromStructure(field);
            if (node) {
                this._children.push(node);
            }
        });
    }


    // refreshSubtypes() {
    //     // TODO: only if complex (fqn has a dot in it - is there already an "isComplex" or "isPrimitive" function inside fqn?)
    //     this.api.getSubtypes(this.rtc, [this.describer]).get(this.describer).pipe(first()).subscribe(subtypes => this.setSubtypes(subtypes));
    // }


    setSubtypes(subtypes: XoStructureType[]) {
        this._subtypes = subtypes;
    }
}


export class ArraySkeletonTreeNode extends ComplexSkeletonTreeNode {

}


export class ArrayEntrySkeletonTreeNode extends ComplexSkeletonTreeNode {

}



/**
 * Data Source for a tree made of a data type structure.
 * In contrast to the StructureTreeDataSource, this data source does not hold instances of the structured data types but
 * only represents the data type's skeleton itself
 */
export class SkeletonTreeDataSource implements TreeNodeFactory {
    private readonly _node$ = new BehaviorSubject<SkeletonTreeNode>(null);


    constructor(protected describer: XoDescriber, protected api: ApiService, protected rtc: RuntimeContext) {
    }


    refresh() {
        this.api.getStructure(this.rtc, [this.describer]).get(this.describer).pipe(first()).subscribe(structure => this.setStructure(structure));
    }


    setStructure(structure: XoStructureField) {
        this._node$.next(this.createNodeFromStructure(structure));
    }


    get node$(): Observable<SkeletonTreeNode> {
        return this._node$.asObservable();
    }



    /* ***   Tree Node Factory   *** */

    createNodeFromStructure(structure: XoStructureField): SkeletonTreeNode {
        let node: SkeletonTreeNode = null;
        if (structure instanceof XoStructurePrimitive) {
            node = this.createPrimitiveNode(structure);
        } else if (structure instanceof XoStructureComplexField) {
            node = this.createComplexNode(structure);
        }
        return node;
    }


    createPrimitiveNode(structure: XoStructurePrimitive): PrimitiveSkeletonTreeNode {
        return new PrimitiveSkeletonTreeNode(structure, this);
    }


    createComplexNode(structure: XoStructureComplexField): ComplexSkeletonTreeNode {
        return new ComplexSkeletonTreeNode(structure, this);
    }


    createArrayNode(structure: XoStructureArray): ArraySkeletonTreeNode {
        return new ArraySkeletonTreeNode(structure, this);
    }


    createArrayEntryNode(structure: XoStructureArray): ArrayEntrySkeletonTreeNode {
        return new ArraySkeletonTreeNode(structure, this);
    }
}
