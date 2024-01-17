import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray } from '@zeta/api';
import { XoExpression } from './expression.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.expression', 'ModelledExpression')
export class XoModelledExpression extends XoObject {


    @XoProperty(XoExpression)
    sourceExpression: XoExpression = new XoExpression();


    @XoProperty(XoExpression)
    targetExpression: XoExpression = new XoExpression();


}

@XoArrayClass(XoModelledExpression)
export class XoModelledExpressionArray extends XoArray<XoModelledExpression> {
}
