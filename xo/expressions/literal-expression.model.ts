import { XoObjectClass, XoArrayClass, XoProperty, XoArray } from '@zeta/api';
import { XoExpression1Arg } from './expression1-arg.model';


@XoObjectClass(XoExpression1Arg, 'xmcp.processmodeller.datatypes.expression', 'LiteralExpression')
export class XoLiteralExpression extends XoExpression1Arg {


    @XoProperty()
    value: string;


}

@XoArrayClass(XoLiteralExpression)
export class XoLiteralExpressionArray extends XoArray<XoLiteralExpression> {
}
