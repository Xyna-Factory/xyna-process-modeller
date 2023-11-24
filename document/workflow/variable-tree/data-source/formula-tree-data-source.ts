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
import { ArrayEntrySkeletonTreeNode, ArraySkeletonTreeNode, ComplexSkeletonTreeNode, PrimitiveSkeletonTreeNode, SkeletonTreeDataSource } from './skeleton-tree-data-source';



export class PrimitiveFormulaTreeNode extends PrimitiveSkeletonTreeNode {
    
}


export class ArrayFormulaTreeNode extends ArraySkeletonTreeNode {
    
}


export class ArrayEntryFormulaTreeNode extends ArrayEntrySkeletonTreeNode {
    
}


export class ComplexFormulaTreeNode extends ComplexSkeletonTreeNode {
}

// how to handle arrays? Use a name here which is the name to identify the node? For list entry, it's the index?
// Or have different node types per structure type? If so, don't do this with inheritence but with templates:
//      each VariableTreeNode produces a template corresponding to its type and data. This template gets rendered and passes input data back to this node model
//      but where to store a selected list index in the model?


/**
 * Data Source for a tree made of formulas
 */
export class FormulaTreeDataSource extends SkeletonTreeDataSource {

    createPrimitiveNode(structure: XoStructurePrimitive): PrimitiveFormulaTreeNode {
        return new PrimitiveFormulaTreeNode(structure, this);
    }


    createComplexNode(structure: XoStructureComplexField): ComplexFormulaTreeNode {
        return new ComplexFormulaTreeNode(structure, this);
    }


    createArrayNode(structure: XoStructureArray): ArrayFormulaTreeNode {
        return new ArrayFormulaTreeNode(structure, this);
    }


    createArrayEntryNode(structure: XoStructureArray): ArrayEntryFormulaTreeNode {
        return new ArrayEntryFormulaTreeNode(structure, this);
    }
}
