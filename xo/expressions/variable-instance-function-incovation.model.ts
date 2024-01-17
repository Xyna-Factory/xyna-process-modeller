import { XoObjectClass, XoArrayClass, XoProperty, XoArray } from '@zeta/api';
import { XoVariableAccessPart } from './variable-access-part.model';
import { XoExpressionArray } from './expression.model';


@XoObjectClass(XoVariableAccessPart, 'xmcp.processmodeller.datatypes.expression', 'VariableInstanceFunctionIncovation')
export class XoVariableInstanceFunctionIncovation extends XoVariableAccessPart {


    @XoProperty(XoExpressionArray)
    functionParameter: XoExpressionArray = new XoExpressionArray();


}

@XoArrayClass(XoVariableInstanceFunctionIncovation)
export class XoVariableInstanceFunctionIncovationArray extends XoArray<XoVariableInstanceFunctionIncovation> {
}
