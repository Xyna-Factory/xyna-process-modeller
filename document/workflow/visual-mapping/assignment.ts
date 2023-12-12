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

import { XoFormula } from '@pmod/xo/formula.model';
import { ComparablePath, SkeletonTreeNode } from '../variable-tree/data-source/skeleton-tree-data-source';
import { XoVariable } from '@pmod/xo/variable.model';
import { FormulaPartVariable } from '@pmod/xo/util/formula-parts/formula-part-variable';
import { FormulaPartOperation } from '@pmod/xo/util/formula-parts/formula-part-operation';
import { FormulaPartMember } from '@pmod/xo/util/formula-parts/formula-part-member';
import { Comparable } from '@zeta/base';


export abstract class XoFormulaNode extends Comparable implements ComparablePath {
    value: string;

    abstract parse(formula: XoFormula, index: number): void;

    get child(): XoFormulaNode {
        return null;
    }
}

export class XoFormulaOperationNode extends XoFormulaNode {
    operation: string;      // function like "length" or operation like "+" or "="
    operands: XoFormulaNode[];

    parse(formula: XoFormula, index: number) {
        this.operation = (formula.parts[index] as FormulaPartOperation)?.part ?? '<noop>';
        // TODO parse operands
    }
}

export abstract class XoFormulaVariableNode extends XoFormulaNode {
    variable: XoVariable;
    member: XoFormulaMemberNode;

    get child(): XoFormulaMemberNode {
        return this.member;
    }
}

export class XoFormulaMemberNode extends XoFormulaVariableNode {

    parse(formula: XoFormula, index: number) {
        const part = formula.parts[index] as FormulaPartMember;
        this.variable = part.variable;
    }
}

export class XoFormulaRootVariableNode extends XoFormulaVariableNode {
    variableIndex: number;

    parse(formula: XoFormula, index: number) {
        const part = formula.parts[index] as FormulaPartVariable;
        this.variable = part.variable;
        this.variableIndex = part.index;

        if (formula.parts[index + 1] instanceof FormulaPartMember) {
            this.member = new XoFormulaMemberNode();
            this.member.parse(formula, index + 1);
        }
    }
}



export interface MemberPath<T = any> {
    formula: XoFormulaRootVariableNode;
    node: SkeletonTreeNode<T>;
}


export class Assignment<T = any> {
    destination: MemberPath<T>;
    sources: MemberPath<T>[] = [];

    constructor(protected formula: XoFormula) {

        const assignmentOperatorIndex = formula.parts.findIndex(part => part.part === '=');

        formula.parts.forEach((part, index) => {
            if (part instanceof FormulaPartVariable) {
                const formulaVariableNode = new XoFormulaRootVariableNode();
                formulaVariableNode.parse(formula, index);

                if (index < assignmentOperatorIndex && !this.destination) {
                    this.destination = { formula: formulaVariableNode, node: null };
                } else {
                    this.sources.push({ formula: formulaVariableNode, node: null });
                }
            }
        });
    }


    get memberPaths(): MemberPath<T>[] {
        return this.sources.concat(this.destination ?? []);
    }
}





        /** TODO: Retrieve from server because it also parses the formula into a tree
         
         need sth. like
         
         CenterNode {
           left, right: FormulaNode;
           operator: "=" | "==" | "<" | ...
         }
         
         IndexNode {
           index: FormulaNode;
           child: FormulaNode;
         }
         
         VariableNode {       // for %n%
           formula: FormulaNode;
           member: MemberNode;
         }
         
         ArrayNode {
           index: IndexNode;
         }

         MemberNode {
           formula: FormulaNode;
         }

         FunctionNode {
           name: string;
           operands: FormulaNode[];
         }
         
        */

    /**
     * TODO
     * 
     * Assignment {
     *   formula: XoFormula;
     *   destination: FormulaTreeNode;
     *   sources: FormulaTreeNode[];
     * 
     *   * split the formula by the Equals-Part
     *   * find destination variable in left half
     *     * find correct FormulaTree by variable-index
     *     * climb up the tree until the end of the formula-half has found a FormulaTreeNode
     *   * find source variables in left (could be the index of an array element) AND right half
     *   * LATER: Create new TreeNodes or change to a subtype, corresponding to formula
     * }
     * 
     * AssignmentComponent {
     *   assignments: Assignment[];
     *   * for each assignment, find DOM element (ComponentMappingService) and draw a spline
     *   * use dataflow-component and split up the elementary part
     *   * test: double the control points for the spline to get a 90° angle
     *   * draw all assignments
     * }
     */