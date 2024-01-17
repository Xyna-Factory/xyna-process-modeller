import { XoObjectClass, XoArrayClass, XoArray } from '@zeta/api';
import { XoExpression } from './expression.model';


@XoObjectClass(XoExpression, 'xmcp.processmodeller.datatypes.expression', 'Expression1Arg')
export class XoExpression1Arg extends XoExpression {





}

@XoArrayClass(XoExpression1Arg)
export class XoExpression1ArgArray extends XoArray<XoExpression1Arg> {
}
