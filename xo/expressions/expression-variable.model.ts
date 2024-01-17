import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray } from '@zeta/api';
import { XoVariableAccessPartArray } from './variable-access-part.model';
import { XoExpression } from './expression.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.expression', 'ExpressionVariable')
export class XoExpressionVariable extends XoObject {


    @XoProperty()
    varNum: number;


    @XoProperty(XoVariableAccessPartArray)
    parts: XoVariableAccessPartArray = new XoVariableAccessPartArray();


    @XoProperty(XoExpression)
    indexDef: XoExpression = new XoExpression();


}

@XoArrayClass(XoExpressionVariable)
export class XoExpressionVariableArray extends XoArray<XoExpressionVariable> {
}
