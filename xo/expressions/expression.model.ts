import { XoObjectClass, XoArrayClass, XoObject, XoArray } from '@zeta/api';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.expression', 'Expression')
export class XoExpression extends XoObject {





}

@XoArrayClass(XoExpression)
export class XoExpressionArray extends XoArray<XoExpression> {
}
