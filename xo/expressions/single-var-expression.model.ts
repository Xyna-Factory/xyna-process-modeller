import { XoObjectClass, XoArrayClass, XoProperty, XoArray } from '@zeta/api';
import { XoExpression1Arg } from './expression1-arg.model';
import { XoExpressionVariable } from './expression-variable.model';


@XoObjectClass(XoExpression1Arg, 'xmcp.processmodeller.datatypes.expression', 'SingleVarExpression')
export class XoSingleVarExpression extends XoExpression1Arg {


    @XoProperty(XoExpressionVariable)
    variable: XoExpressionVariable = new XoExpressionVariable();


}

@XoArrayClass(XoSingleVarExpression)
export class XoSingleVarExpressionArray extends XoArray<XoSingleVarExpression> {
}
