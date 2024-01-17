import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray } from '@zeta/api';
import { XoModelledExpressionArray } from './modelled-expression.model';


@XoObjectClass(null, 'xmcp.processmodeller.datatypes.response', 'GetModelledExpressionsResponse')
export class XoGetModelledExpressionsResponse extends XoObject {


    @XoProperty(XoModelledExpressionArray)
    modelledExpressions: XoModelledExpressionArray = new XoModelledExpressionArray();


}

@XoArrayClass(XoGetModelledExpressionsResponse)
export class XoGetModelledExpressionsResponseArray extends XoArray<XoGetModelledExpressionsResponse> {
}
