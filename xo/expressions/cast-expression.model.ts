import { XoObjectClass, XoArrayClass, XoArray, XoTransient, XoProperty } from '@zeta/api';
import { XoFunctionExpression } from './function-expression.model';
import { RecursiveStructure, RecursiveStructurePart } from './RecursiveStructurePart';
import { XoExpressionVariable } from './expression-variable.model';
import { XoLiteralExpression } from './literal-expression.model';


@XoObjectClass(XoFunctionExpression, 'xmcp.processmodeller.datatypes.expression', 'CastExpression')
export class XoCastExpression extends XoFunctionExpression implements RecursiveStructure {


    @XoProperty()
    @XoTransient()
    variable: XoExpressionVariable;


    extractInvolvedVariable(): RecursiveStructure[] {
        return [this, ...this.getExpressionVariable().extractInvolvedVariable()];
    }

    extractFirstStructure(): RecursiveStructure {
        return this;
    }

    private getExpressionVariable(): XoExpressionVariable {
        return this.variable ?? (this.variable = this.subExpressions.data[1].getFirstVariable());
    }


    getRecursiveStructure(): RecursiveStructurePart {
        const root: RecursiveStructurePart = this.subExpressions.data[1].extractFirstStructure().getRecursiveStructure();
        let next: RecursiveStructurePart = root;
        while (next.child) {
            next = next.child;
        }
        next.fqn = (this.subExpressions.data[0] as XoLiteralExpression).value;
        this.parts.data.forEach(part => {
            next.child = new RecursiveStructurePart(part.name);
            next = next.child;
            if (part.indexDef) {
                next.child = new RecursiveStructurePart('[' + part.indexDef.toString() + ']');
                next = next.child;
            }
        });
        return root;
    }


    getVariable(): XoExpressionVariable {
        return this.getExpressionVariable();
    }


    toString(): string {
        return this.subExpressions.data[1] +
            '#cast(' +
            this.subExpressions.data[0] + ')' +
            (this.indexDef ? '[' + this.indexDef.toString() + ']' : '') +
            (this.parts && this.parts.length > 0 ? '.' + this.parts.data.map(part => part.toString()).join('.') : '');
    }

}

@XoArrayClass(XoCastExpression)
export class XoCastExpressionArray extends XoArray<XoCastExpression> {
}
