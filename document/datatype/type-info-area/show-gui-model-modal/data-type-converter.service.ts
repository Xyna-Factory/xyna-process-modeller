/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';

import { FullQualifiedName } from '@zeta/api';

import { XoDataMemberVariable } from '../../../../xo/data-member-variable.model';
import { XoDataType } from '../../../../xo/data-type.model';


// default zeta destination
const ZETA_DEFAULT_DESTINATION = '@zeta/api';

// name of xyna base class, if data type is a storable and conversion should not be a child
const ZETA_BASE_STORABLES = ['Storable', 'BaseStorable'];

const ZETA_DEFAULT_CONSTRUCTOR =
`constructor(_ident: string) {
    super(_ident);
}`;

// selector of the root data type element
const DATA_TYPE_ROOT_SELECTOR = 'DataType';
// selector of the element, in which the documentation of the data type is stored as a text node
// element only exists if there is a documentation
const DATA_TYPE_DOCUMENTATION_SELECTOR = 'DataType > Meta > Documentation';
// selector of all properties of the data type
const DATA_TYPE_PROPERTIES_SELECTOR_ALL = 'DataType > Data';

// attribute of the data type root element, whose value is the data type's path
const DATA_TYPE_TYPE_PATH_ATTR = 'TypePath';
// attribute of the data type root element, whose value is the data type's name
const DATA_TYPE_TYPE_NAME_ATTR = 'TypeName';
// attribute of the data type root element, whose value is the data type's label
// which is not (yet) used in the Zeta compatiple class
const DATA_TYPE_LABEL_ATTR = 'Label';

// attribute of the data type root element, whose value is the parent data type's path
// attribute only exists if there is a parent data type
const DATA_TYPE_BASE_TYPE_PATH_ATTR = 'BaseTypePath';
// attribute of the data type root element, whose value is the parent data type's name
// attribute only exists if there is a parent data type
const DATA_TYPE_BASE_TYPE_NAME_ATTR = 'BaseTypeName';

// --------------------

// selector of the element, in which the primitive type is stored as a text node
// element only exists if property is of primitive data type
// if element does not exist -> it's a complex type
const PROPERTY_TYPE_SELECTOR = 'Meta > Type';
// selector of the element, whose text node has the value of the documentation
const PROPERTY_DOCUMENTATION_SELECTOR = 'Meta > Documentation';
// selector of the element, whose text node has the value of the persistence type
// only innerHTML = 'UniqueIdentifier' is relevant for convertion
const PROPERTY_PERSISTENCE_TYPE_SELECTOR = 'Meta > Persistence > Type';

// attribute of the property element, whose value is the path of the data type, to which this property is a reference
// attribute only exists if property is complex and not primitive
const PROPERTY_REFERENCE_PATH_ATTR = 'ReferencePath';
// attribute of the property element, whose value is the name of the data type, to which this property is a reference
// attribute only exists if property is complex and not primitive
const PROPERTY_REFERENCE_NAME_ATTR = 'ReferenceName';
// attribute of the property element, whose value is the variable name of this property in the data type
const PROPERTY_VARIABLE_NAME_ATTR = 'VariableName';
const PROPERTY_LABEL_ATTR = 'Label';
const PROPERTY_IS_LIST_ATTR = 'IsList';

function getTemplateString(str: string): string { return '\'' + str + '\''; }

function getPascalCaseString(str: string): string {
    str = str.trim();
    str = str.substr(0, 1).toUpperCase() + str.substring(1);

    const detectAllNotAllowedChars = /([\s_-])/;
    let res: RegExpExecArray;
    while ((res = detectAllNotAllowedChars.exec(str))) {
        str = str.replace(res[0], '');
    }
    return str;
}

function getZetaClassString(str: string): string {
    return 'Xo' + getPascalCaseString(str);
}

function getStringifyArrayString(arr: StringifyClass[]): string {
    const lines: string[] = [];
    let i: number;
    for (i = 0; i < arr.length; i++) {
        lines.push(arr[i].stringify());
    }
    return lines.join('\n');
}

function getKebabCaseString(str: string): string {
    str = str.trim();

    let char = str[0];
    let res = str[0];
    let i;
    let curCharIsUpperCase = false;
    let lastCharWasUpperCase = false;
    // 65 - 90 -> upper case
    // 97 - 122 -> lower case
    for (i = 1; i < str.length; i++) {
        char = str[i];

        if (char.charCodeAt(0) >= 60 && char.charCodeAt(0) <= 90) {
            curCharIsUpperCase = true;
        } else {
            curCharIsUpperCase = false;
        }

        if ([' ', '_'].indexOf(char) >= 0) {
            res += '-';
        } else {
            res += (!lastCharWasUpperCase && curCharIsUpperCase ? '-' : '') + char;
        }

        if (char.charCodeAt(0) >= 60 && char.charCodeAt(0) <= 90) {
            lastCharWasUpperCase = true;
        } else {
            lastCharWasUpperCase = false;
        }
    }

    return res.toLowerCase();
}

function getDocumentationString(str: string, identString?: string, javaDoc = true) {
    let doc: string;
    identString = identString || '';
    if (javaDoc) {
        doc = identString + '/**\n' + identString + ' * ' + str.replace(/\n/gm, '\n' + identString + ' * ') + '\n' + identString + ' */';
    } else {
        doc = identString + '// ' + str.replace(/\n/gm, '\n' + identString + '// ');
    }
    return doc;
}

function getIndentString(str: string, indent: string): string {
    // regex Of First Char In Line
    return str.replace(/^/gm, indent);
}

/**
 * HARD CODE HERE: the pool of decorators, which exists for properties
 * the number of property decorators, used in the zeta framework, is known from the start
 * hence the word 'static'
 * @param replaces - optional array of instances, which will be replaced in the pool
 */
function getStaticDecoratorPool(replaces?: ZetaDecorator[]): ZetaDecorator[] {
    const pool = [
        new ZetaDecorator(ZetaDecoratorType.XoProperty),
        new ZetaDecorator(ZetaDecoratorType.XoUnique),
        new ZetaDecorator(ZetaDecoratorType.XoEnumerated),
        new ZetaDecorator(ZetaDecoratorType.XoTransient),
        new ZetaDecorator(ZetaDecoratorType.XoI18n)
    ];

    let i: number, j: number;

    if (replaces && replaces.length) {
        for (i = 0; i < replaces.length; i++) {
            for (j = 0; j < pool.length; j++) {
                if (replaces[i].type === pool[j].type) {
                    pool[j] = replaces[i];
                }
            }
        }
    }

    return pool;
}

function getDecoratorsFromPool(types: ZetaDecoratorType[], pool: ZetaDecorator[]): ZetaDecorator[] {
    let t: number, p: number;
    const decs: ZetaDecorator[] = [];
    for (t = 0; t < types.length; t++) {
        for (p = 0; p < pool.length; p++) {
            if (types[t] === pool[p].type) {
                decs.push(pool.splice(p, 1)[0]);
                p--; // TODO - might be necessary - check this!
            }
        }
    }
    return decs;
}

interface StringifyClass {
    stringify: (options?: any) => string;
}

export enum ZetaDecoratorType {
    XoArrayClass = 'XoArrayClass',
    XoObjectClass = 'XoObjectClass',
    XoProperty = 'XoProperty',
    XoTransient = 'XoTransient',
    XoI18n = 'XoI18n',
    XoEnumerated = 'XoEnumerated',
    XoUnique = 'XoUnique'
}

export class ZetaDecorator implements StringifyClass {

    private readonly args: string[];

    private _importDestination: string;

    get importDestination(): string {
        return this._importDestination ? this._importDestination : ZETA_DEFAULT_DESTINATION;
    }
    set importDestination(value: string) {
        this._importDestination = value;
    }

    constructor(public type: ZetaDecoratorType, ...args: string[]) {
        this.args = args;
    }

    addArgument(value: string) {
        this.args.push(value);
    }

    stringify() {
        const args = this.args.join(', ');
        return '@' + this.type + '(' + args + ')';
    }

    toString(): string { return this.type; }
}

export class TypeScriptImports implements StringifyClass {
    destinationTokenMap = new Map<string, Map<string, string>>();

    set(token: string, destination: string) {
        if (this.destinationTokenMap.has(destination)) {
            this.destinationTokenMap.get(destination).set(token, destination);
        } else {
            const tmp = new Map<string, string>();
            tmp.set(token, destination);
            this.destinationTokenMap.set(destination, tmp);
        }
    }

    stringify(): string {
        const dest = Array.from(this.destinationTokenMap.keys());
        const lines: string[] = [];
        let i: number, tokens: string[];
        for (i = 0; i < dest.length; i++) {
            tokens = Array.from(this.destinationTokenMap.get(dest[i]).keys());
            lines.push('import { ' + tokens.join(', ') + ' } from ' + getTemplateString(dest[i]) + ';');
        }
        return lines.join('\n');
    }

    clear() {
        const dest = Array.from(this.destinationTokenMap.keys());
        let i: number;
        for (i = 0; i < dest.length; i++) {
            this.destinationTokenMap.get(dest[i]).clear();
        }
        this.destinationTokenMap.clear();
    }
}

export class DataTypeProperty implements StringifyClass {


    indentString: string;
    seperatorString: string;

    refPath: string;
    refName: string;
    name: string;

    private _javaType: string;

    get javaType(): string {
        return this._javaType;
    }

    /**
     * isComplex and isList needs to be set before javaType
     */
    set javaType(value: string) {
        this._javaType = value;
        this.type = value;

        if (!this.isComplex) {
            if (['int', 'long', 'double', 'Integer', 'Long', 'Double'].indexOf(this.type) >= 0) {
                this.type = 'number';
            }
            this.type = this.type === 'String' ? 'string' : this.type === 'Boolean' ? 'boolean' : this.type;
            this.type = this.isList ? this.type + '[]' : this.type;
        } else {
            this.type = getZetaClassString(this.type) + (this.isList ? 'Array' : '');
        }
    }

    type: string;

    label: string;

    isComplex: boolean;

    isList: boolean;
    isUniqueIdentifier: boolean; // being unique identifier in the xyna model, does not automatically mean in zeta as well

    documentation: string;

    options = new PropertyConversionOptions();

    stringify(): string {
        let i: number;
        const lines: string[] = [];

        if (this.options.convertDocumentation) {
            lines.push(getDocumentationString(this.documentation, this.indentString));
        }

        for (i = 0; i < this.options.decorators.length; i++) {
            lines.push(this.indentString + this.options.decorators[i].stringify());
        }

        if (this.options.preinitilize) {
            lines.push(this.indentString + this.name + ': ' + this.type + ' = ' + this.options.value + ';');
        } else {
            lines.push(this.indentString + this.name + ': ' + this.type + ';'); // TODO - allow preinitialize
        }

        return lines.join('\n') + this.seperatorString;
    }
}

export class DataTypeConvertable implements StringifyClass {

    template: string;

    imports: TypeScriptImports = new TypeScriptImports();
    objectClassDecorators: ZetaDecorator[] = [];
    arrayClassDecorators: ZetaDecorator[] = [];

    path: string;
    name: string;
    label: string;
    isChild: boolean;

    get zetaName(): string {
        return getZetaClassString(this.name);
    }

    basePath: string;
    baseName: string;

    documentation: string;

    childProperties: DataTypeProperty[] = [];
    properties: DataTypeProperty[] = [];

    filename: string;

    options = new DataTypeConversionOptions();

    stringify(): string {

        const templateBuilder = new TemplateBuilder(this.template);

        let token: TemplateToken, dec: ZetaDecorator;

        // setting @XoArrayClass Decorator and its import
        this.objectClassDecorators = [];
        dec = new ZetaDecorator(
            ZetaDecoratorType.XoObjectClass,
            (this.isChild && this.options.convertInheritance) ? getZetaClassString(this.baseName) : 'null',
            getTemplateString(this.path),
            getTemplateString(this.name)
        );
        this.objectClassDecorators.push(dec);

        // setting XoArrayClass Decorator and its import
        this.arrayClassDecorators = [];
        dec = new ZetaDecorator(
            ZetaDecoratorType.XoArrayClass, this.zetaName
        );
        this.arrayClassDecorators.push(dec);

        //
        this._getAllImports();

        // insert the correct string for found token in the template
        for (token of templateBuilder.tokens) {
            switch (token.type) {

                case TemplateTokenType.imports: {
                    templateBuilder.insert(token, this.imports.stringify());
                } break;
                case TemplateTokenType.objectDocumentation: {
                    templateBuilder.insert(token,
                        this.options.convertDocumentation ? getDocumentationString(this.documentation) : '');
                } break;
                case TemplateTokenType.objectDecorators: {
                    templateBuilder.insert(token, getStringifyArrayString(this.objectClassDecorators));
                } break;
                case TemplateTokenType.objectClassBegin: {
                    const openObjClass = 'export class ' + this.zetaName + ' extends '
                        + (this.isChild && this.options.convertInheritance ? getZetaClassString(this.baseName) : 'XoObject') + ' {';
                    templateBuilder.insert(token, openObjClass);
                } break;
                case TemplateTokenType.objectProperties: {
                    let i: number;
                    let propsArr: DataTypeProperty[] = [...this.properties];
                    if (this.isChild && this.options.convertChildProperties) {
                        propsArr = [...this.childProperties, ...propsArr];
                    }
                    for (i = 0; i < propsArr.length; i++) {
                        propsArr[i].indentString = token.args && token.args.length ? token.args[0] : '';
                        propsArr[i].seperatorString =
                            token.args && token.args.length > 1 && i < propsArr.length - 1
                                ? token.args[1] : '';
                    }
                    const props = getStringifyArrayString(propsArr);
                    templateBuilder.insert(token, props);
                } break;
                case TemplateTokenType.objectConstructor: {
                    if (this.options.createConstructor) {
                        templateBuilder.insert(token,
                            getIndentString(ZETA_DEFAULT_CONSTRUCTOR, token.args ? token.args[0] : '\n'));
                    } else {
                        templateBuilder.remove(token, '\n\n');
                    }
                } break;
                case TemplateTokenType.objectClassEnd: {
                    templateBuilder.insert(token, '}');
                } break;
                case TemplateTokenType.arrayDecorators: {
                    templateBuilder.insert(token, getStringifyArrayString(this.arrayClassDecorators));
                } break;
                case TemplateTokenType.arrayClassBegin: {
                    const openArrayClass =
                    'export class ' + this.zetaName + 'Array extends XoArray<' + this.zetaName + '> {';
                    templateBuilder.insert(token, openArrayClass);
                } break;
                case TemplateTokenType.arrayClassEnd: {
                    templateBuilder.insert(token, '}');
                } break;

            }
        }

        return templateBuilder.template;
    }

    private _getAllImports() {
        let dec: ZetaDecorator;
        let prop: DataTypeProperty;

        // delete all (used and unused)
        this.imports.clear(); // TODO

        for (dec of this.objectClassDecorators) {
            this.imports.set(dec.type, dec.importDestination);
        }

        for (dec of this.arrayClassDecorators) {
            this.imports.set(dec.type, dec.importDestination);
        }

        for (prop of this.properties) {
            for (dec of prop.options.decorators) {
                this.imports.set(dec.type, dec.importDestination);
            }
        }

        if (!this.isChild || !this.options.convertInheritance) { // TODO check if correct
            this.imports.set('XoObject', ZETA_DEFAULT_DESTINATION);
        }
        this.imports.set('XoArray', ZETA_DEFAULT_DESTINATION);

    }

}

export class DataTypeConversionOptions {
    convertDocumentation = false;
    convertInheritance = true;
    convertChildProperties = false;
    createConstructor = false;
}

export class PropertyConversionOptions {
    convertDocumentation = false;

    preinitilize: boolean;
    value: string;

    decoratorPool: ZetaDecorator[];
    decorators: ZetaDecorator[] = [];

    /**
     * not recommended but sometimes necessary
     * this method only works because ZetaDecoratorType is an enum out of string values
     */
    setDecoratorByArray(arr: string[]) {
        let str: string, i: number;
        this.decoratorPool = this.decoratorPool.concat(this.decorators);
        this.decorators = [];
        for (str of arr) {
            for (i = 0; i < this.decoratorPool.length; i++) {
                if (this.decoratorPool[i].type === str) {
                    this.decorators.push(this.decoratorPool.splice(i, 1)[0]);
                    i--; // TODO - might be necessary - check this!
                }
            }
        }
    }
}

@Injectable()
export class DataTypeConverterService {

    private readonly _domParser = new DOMParser();

    readXML(xmlString: string): DataTypeConvertable {
        const datatype = new DataTypeConvertable();

        const xmlDocument = this._domParser.parseFromString(xmlString, 'text/xml');
        const dataTypeRootNode = xmlDocument.querySelector(DATA_TYPE_ROOT_SELECTOR);
        const docNode = dataTypeRootNode.querySelector(DATA_TYPE_DOCUMENTATION_SELECTOR);
        const propertyNodes = dataTypeRootNode.querySelectorAll(DATA_TYPE_PROPERTIES_SELECTOR_ALL);

        datatype.template = defaultDataTypeTemplate; // template used in the stringify method

        datatype.path = dataTypeRootNode.getAttribute(DATA_TYPE_TYPE_PATH_ATTR);
        datatype.name = dataTypeRootNode.getAttribute(DATA_TYPE_TYPE_NAME_ATTR);
        datatype.label = dataTypeRootNode.getAttribute(DATA_TYPE_LABEL_ATTR);

        datatype.basePath = dataTypeRootNode.getAttribute(DATA_TYPE_BASE_TYPE_PATH_ATTR);
        datatype.baseName = dataTypeRootNode.getAttribute(DATA_TYPE_BASE_TYPE_NAME_ATTR);

        // data type needs to inherit from BaseStorable in order to be persisted in the database
        // but is does not mean that it is a child in the matter of the zeta framework
        datatype.isChild = !!datatype.baseName && ZETA_BASE_STORABLES.indexOf(datatype.baseName) < 0;
        datatype.documentation = docNode ? docNode.innerHTML : '';

        datatype.properties = [];

        // ### Looping through and creating properties

        let i: number, node: Element, prop: DataTypeProperty;
        for (i = 0; i < propertyNodes.length; i++) {
            const decs: ZetaDecorator[] = [];
            node = propertyNodes.item(i);
            prop = new DataTypeProperty();

            prop.refPath = node.getAttribute(PROPERTY_REFERENCE_PATH_ATTR);
            prop.refName = node.getAttribute(PROPERTY_REFERENCE_NAME_ATTR);
            prop.name = node.getAttribute(PROPERTY_VARIABLE_NAME_ATTR);
            prop.label = node.getAttribute(PROPERTY_LABEL_ATTR);
            prop.isList = (node.getAttribute(PROPERTY_IS_LIST_ATTR) === 'true');

            const persTypeNode = node.querySelector(PROPERTY_PERSISTENCE_TYPE_SELECTOR);
            prop.isUniqueIdentifier = !!(persTypeNode && persTypeNode.innerHTML === 'UniqueIdentifier');
            const propDocNode = node.querySelector(PROPERTY_DOCUMENTATION_SELECTOR);
            prop.documentation = (propDocNode) ? propDocNode.innerHTML : '';

            // javaType needs to be set after isList and isComplex -> check setter!
            const typeNode = node.querySelector(PROPERTY_TYPE_SELECTOR);
            prop.isComplex = !typeNode;
            prop.javaType = typeNode ? typeNode.innerHTML : prop.refName;

            // setting @XoProperty Decorator and its import
            if (prop.isComplex) {
                decs.push(new ZetaDecorator(ZetaDecoratorType.XoProperty, prop.type));
                prop.options.preinitilize = true;
                prop.options.value = 'new ' + prop.type + '()';
            } else {
                decs.push(new ZetaDecorator(ZetaDecoratorType.XoProperty));
            }

            if (prop.isUniqueIdentifier) {
                decs.push(new ZetaDecorator(ZetaDecoratorType.XoUnique));
            }

            // fill decorator pool of this property
            prop.options.decoratorPool = getStaticDecoratorPool(decs);
            const types: ZetaDecoratorType[] = decs.map(dec => dec.type);
            prop.options.decorators = getDecoratorsFromPool(types, prop.options.decoratorPool);

            datatype.properties.push(prop);
        }
        // ### propertyNodes-Loop END

        datatype.filename = getKebabCaseString(getZetaClassString(datatype.label)) + '.model.ts';

        return datatype;
    }

    readXoDataType(object: XoDataType): DataTypeConvertable {
        const datatype = new DataTypeConvertable();

        datatype.template = defaultDataTypeTemplate; // template used in the stringify method

        const fqn = FullQualifiedName.decode(object.$fqn);
        const baseTypeFqn = FullQualifiedName.decode(object.typeInfoArea.baseType);
        // const isStorable = !!object.storablePropertyArea;

        datatype.path = fqn.path;
        datatype.name = fqn.name;
        datatype.label = object.label;

        datatype.basePath = baseTypeFqn ? baseTypeFqn.path : '';
        datatype.baseName = baseTypeFqn ? baseTypeFqn.name : '';

        // data type needs to inherit from BaseStorable in order to be persisted in the database
        // but is does not mean that it is a child in the matter of the zeta framework
        datatype.isChild = !!datatype.baseName && datatype.baseName !== 'Storable';
        datatype.documentation = object.documentationArea ? object.documentationArea.text : '';

        datatype.childProperties = [];
        datatype.properties = [];

        // PROPERTIES
        let prop: DataTypeProperty;
        let property: XoDataMemberVariable;

        if (datatype.isChild) {
            for (const item of object.inheritedVarsArea.items) {
                property = item as XoDataMemberVariable;
                prop = this.readPropertyOfXoDataType(property);
                datatype.childProperties.push(prop);
            }
        }

        for (const item of object.memberVarsArea.items) {
            property = item as XoDataMemberVariable;
            prop = this.readPropertyOfXoDataType(property);
            datatype.properties.push(prop);
        }

        datatype.filename = getKebabCaseString(getZetaClassString(datatype.label)) + '.model.ts';

        return datatype;
    }

    private readPropertyOfXoDataType(property: XoDataMemberVariable): DataTypeProperty {
        const decs: ZetaDecorator[] = [];
        const prop = new DataTypeProperty();

        const refFqn = FullQualifiedName.decode(property.$fqn);

        prop.refPath = refFqn ? refFqn.path : '';
        prop.refName = refFqn ? refFqn.name : '';
        prop.name = property.name;
        prop.label = property.label;
        prop.isList = property.isList;

        prop.isUniqueIdentifier = property.storableRole === 'uniqueIdentifier'; // TODO
        prop.documentation = property.documentationArea.text;

        // javaType needs to be set after isList and isComplex -> check setter!
        prop.isComplex = !!refFqn;
        prop.javaType = property.primitiveType || prop.refName;

        // setting @XoProperty Decorator and its import
        if (prop.isComplex) {
            decs.push(new ZetaDecorator(ZetaDecoratorType.XoProperty, prop.type));
            prop.options.preinitilize = true;
            prop.options.value = 'new ' + prop.type + '()';
        } else {
            decs.push(new ZetaDecorator(ZetaDecoratorType.XoProperty));
        }

        if (prop.isUniqueIdentifier) {
            decs.push(new ZetaDecorator(ZetaDecoratorType.XoUnique));
        }

        // fill decorator pool of this property
        prop.options.decoratorPool = getStaticDecoratorPool(decs);
        const types: ZetaDecoratorType[] = decs.map(dec => dec.type);
        prop.options.decorators = getDecoratorsFromPool(types, prop.options.decoratorPool);

        return prop;
    }
}

class TemplateToken {
    replaced = false;
    replaceString: string;
    constructor(public type: string, public args: string[]) {}
}

/**
 * reads a template and extracts its tokens
 * example token: #TOKEN_TYPE%all%args%are%optional# => type = 'TOKEN_TYPE', args = ['all', 'args', 'are', 'optional']
 */
class TemplateBuilder {

    rawTokensRegEx = /#[A-Z_]+([%]{1}[\w\s\\]*)*#/gm;
    // can only extract the token type but not its arguments because
    // you should be able to give an argument containing only of spacebars, which will be ignored
    // by regexp (maybe bug?)
    typeExtractorRegEx = /^#([A-Z_]+){1}([%]{1}[\w\s\\]*)*#$/;
    tokens: TemplateToken[] = [];

    get template(): string {
        return this.tmpl;
    }

    constructor(private tmpl: string) {
        this._read();
    }

    private _read() {
        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        const rawTokens = this.tmpl.match(this.rawTokensRegEx);
        let str: string;
        let res: RegExpExecArray, type: string, args: string[], argStr: string;
        let token: TemplateToken;

        for (str of rawTokens) {
            res = this.typeExtractorRegEx.exec(str);
            type = res[1];

            // are there args in the rawToken
            if (str.indexOf('%') > 1) {
                // substring parameter explanation:
                // type.length + 2 => type and first pound char and first percent char
                // str.length - 1 => cutting out the 2nd pound char
                // argStr => all arguments seperated by percent
                argStr = str.substring(type.length + 2, str.length - 1);
                args = argStr.split('%');
            } else {
                args = [];
            }
            token = new TemplateToken(type, args);
            token.replaceString = str;
            this.tokens.push(token);
        }
    }

    // insert a string into a token
    insert(token: TemplateToken, str: string) {
        if (!token.replaced) {
            this.tmpl = this.tmpl.replace(token.replaceString, str);
            token.replaced = true;
        }
    }

    // remove the token (the line of the token as well)
    remove(token: TemplateToken, strBefore = '', strAfter = '') {
        if (!token.replaced) {
            const lineRegExp = new RegExp(strBefore + '^[.]*' + token.replaceString + '[.]*$\n' + strAfter, 'gm');
            this.tmpl = this.tmpl.replace(lineRegExp, '');
            token.replaced = true;
        }
    }
}


enum TemplateTokenType {
    imports = 'IMPORTS',
    objectDocumentation = 'OBJECT_DOCUMENTATION',
    objectDecorators = 'OBJECT_DECORATORS',
    objectClassBegin = 'OBJECT_CLASS_BEGIN',
    objectProperties = 'OBJECT_PROPERTIES',
    objectConstructor = 'OBJECT_CONSTRUCTOR',
    objectClassEnd = 'OBJECT_CLASS_END',
    arrayDecorators = 'ARRAY_DECORATORS',
    arrayClassBegin = 'ARRAY_CLASS_BEGIN',
    arrayClassEnd = 'ARRAY_CLASS_END'
}

// #OBJECT_PROPERTIES%identString%seperationString#

const defaultDataTypeTemplate =
`#${TemplateTokenType.imports}#

#${TemplateTokenType.objectDocumentation}#
#${TemplateTokenType.objectDecorators}#
#${TemplateTokenType.objectClassBegin}#


#${TemplateTokenType.objectProperties}%    %\n\n#


#${TemplateTokenType.objectConstructor}%    #


#${TemplateTokenType.objectClassEnd}#

#${TemplateTokenType.arrayDecorators}#
#${TemplateTokenType.arrayClassBegin}#
#${TemplateTokenType.arrayClassEnd}#
`;
