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
import { XoStructureArray, XoStructureComplexField, XoStructurePrimitive } from '@zeta/api';
import { ArrayEntrySkeletonTreeNode, ArraySkeletonTreeNode, ComplexSkeletonTreeNode, PrimitiveSkeletonTreeNode, SkeletonTreeDataSource, SkeletonTreeNode } from './skeleton-tree-data-source';
import { XoFormulaVariableNode } from '../../visual-mapping/assignment';
import { IComparable } from '@zeta/base';



function equalsFormulaNode(treeNode: SkeletonTreeNode, formulaNode: XoFormulaVariableNode): boolean {
    const structure = treeNode.getStructure();
    if (formulaNode && structure.typeFqn) {
        const typeFqn = structure.typeFqn?.encode() ?? '';
        const typeLabel = structure.typeLabel;
        const label = structure.label;
        return typeFqn === formulaNode.variable.$fqn &&
             (typeLabel === formulaNode.variable.label || label === formulaNode.variable.label);
    }
    return false;
}


export class PrimitiveFormulaTreeNode<T = any> extends PrimitiveSkeletonTreeNode<T> {
    equals(that: IComparable): boolean {
        return equalsFormulaNode(this, that as XoFormulaVariableNode);
    }
}


export class ArrayFormulaTreeNode<T = any> extends ArraySkeletonTreeNode<T> {
}


export class ArrayEntryFormulaTreeNode<T = any> extends ArrayEntrySkeletonTreeNode<T> {
}


export class ComplexFormulaTreeNode<T = any> extends ComplexSkeletonTreeNode<T> {
    equals(that: IComparable): boolean {
        return equalsFormulaNode(this, that as XoFormulaVariableNode);
    }
}

// how to handle arrays? Use a name here which is the name to identify the node? For list entry, it's the index?
// Or have different node types per structure type? If so, don't do this with inheritence but with templates:
//      each VariableTreeNode produces a template corresponding to its type and data. This template gets rendered and passes input data back to this node model
//      but where to store a selected list index in the model?


/**
 * Data Source for a tree made of formulas
 * @inheritdoc
 */
export class FormulaTreeDataSource<T = any> extends SkeletonTreeDataSource<T> {

    createPrimitiveNode(structure: XoStructurePrimitive): PrimitiveFormulaTreeNode<T> {
        return new PrimitiveFormulaTreeNode<T>(structure, this);
    }


    createComplexNode(structure: XoStructureComplexField): ComplexFormulaTreeNode<T> {
        return new ComplexFormulaTreeNode<T>(structure, this);
    }


    createArrayNode(structure: XoStructureArray): ArrayFormulaTreeNode<T> {
        return new ArrayFormulaTreeNode<T>(structure, this);
    }


    createArrayEntryNode(structure: XoStructureArray): ArrayEntryFormulaTreeNode<T> {
        return new ArrayEntryFormulaTreeNode<T>(structure, this);
    }


    /**
     * Traverses the tree along with the member's path.
     * Modifies the tree (changes selected subtype or adds array entries) if necessary/possible.
     *
     * @remark Only call synchronously after `root$` has its value
     */
    processMemberPath(path: XoFormulaVariableNode): SkeletonTreeNode {
        console.log('match root?');
        return this.root.match(path) as SkeletonTreeNode;
    }
}
