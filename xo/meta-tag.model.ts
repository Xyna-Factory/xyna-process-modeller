import { XoObjectClass, XoArrayClass, XoProperty, XoArray } from '@zeta/api';
import { XoItem } from './item.model';


@XoObjectClass(XoItem, 'xmcp.processmodeller.datatypes', 'MetaTag')
export class XoMetaTag extends XoItem {


    @XoProperty()
    tag: string;


}

@XoArrayClass(XoMetaTag)
export class XoMetaTagArray extends XoArray<XoMetaTag> {
}
