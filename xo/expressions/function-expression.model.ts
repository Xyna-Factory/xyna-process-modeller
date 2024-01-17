import { XoObjectClass, XoArrayClass, XoProperty, XoArray } from '@zeta/api';
import { XoExpression, XoExpressionArray } from './expression.model';
import { XoVariableAccessPartArray } from './variable-access-part.model';


@XoObjectClass(XoExpression, 'xmcp.processmodeller.datatypes.expression', 'FunctionExpression')
export class XoFunctionExpression extends XoExpression {


    @XoProperty(XoExpressionArray)
    subExpressions: XoExpressionArray = new XoExpressionArray();


    @XoProperty()
    function: string;


    @XoProperty(XoExpression)
    indexDef: XoExpression = new XoExpression();


    @XoProperty(XoVariableAccessPartArray)
    parts: XoVariableAccessPartArray = new XoVariableAccessPartArray();


}

@XoArrayClass(XoFunctionExpression)
export class XoFunctionExpressionArray extends XoArray<XoFunctionExpression> {
}
