import { XoObjectClass, XoArrayClass, XoProperty, XoArray } from '@zeta/api';
import { XoExpression1Arg } from './expression1-arg.model';
import { XoExpression } from './expression.model';


@XoObjectClass(XoExpression1Arg, 'xmcp.processmodeller.datatypes.expression', 'NotExpression')
export class XoNotExpression extends XoExpression1Arg {


    @XoProperty(XoExpression)
    expression: XoExpression = new XoExpression();


}

@XoArrayClass(XoNotExpression)
export class XoNotExpressionArray extends XoArray<XoNotExpression> {
}
