import { XoObjectClass, XoArrayClass, XoProperty, XoArray } from '@zeta/api';
import { XoExpression } from './expression.model';


@XoObjectClass(XoExpression, 'xmcp.processmodeller.datatypes.expression', 'Expression2Args')
export class XoExpression2Args extends XoExpression {


    @XoProperty(XoExpression)
    var1: XoExpression = new XoExpression();


    @XoProperty(XoExpression)
    var2: XoExpression = new XoExpression();


    @XoProperty()
    operator: string;


}

@XoArrayClass(XoExpression2Args)
export class XoExpression2ArgsArray extends XoArray<XoExpression2Args> {
}
