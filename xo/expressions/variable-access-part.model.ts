import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray } from '@zeta/api';
import { XoExpression } from './expression.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.expression', 'VariableAccessPart')
export class XoVariableAccessPart extends XoObject {


    @XoProperty()
    name: string;


    @XoProperty(XoExpression)
    indexDef: XoExpression = new XoExpression();


}

@XoArrayClass(XoVariableAccessPart)
export class XoVariableAccessPartArray extends XoArray<XoVariableAccessPart> {
}
