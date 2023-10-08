import pick from 'lodash-es/pick'
import {getJSType} from '../utils/type'
import {formatParagraph} from '../utils/text'
import {
  ParserMeta,
  ParserContructor,
  ParseType,
  ParseResult,
  PojoProperty
} from "../types/Parser";
import BaseParser from './BaseParser';

const PojoParser: ParserContructor = class PojoParser extends BaseParser {
  static CLASS_RE = /public\s+class\s+(?<class_name>\w+)/g

  // TODO 判断是否只读
  static PROPERTY_RE = /(?:\s*\/\*{2}\s*\n\s*\*\s+(?<desc>(?:[^@].)+?)[\s\S]*?)?private\s+(?<type>[\w<>[\]]+)\s+(?<name>\w+);/g

  private className: string;
  private properties: PojoProperty[];

  constructor(
    javaCode: string,
    javaPath: string,
    meta?: ParserMeta
  ) {
    super(javaCode, javaPath, meta);
    this._getClassName();
    this._getProperties();
    return this;
  }

  private _getClassName() {
    const cRe = new RegExp(PojoParser.CLASS_RE)
    const classMatch: RegExpMatchArray = cRe.exec(this.javaCode);
    this.className = classMatch?.groups?.class_name;
  }

  private _getProperties() {
    const properties: PojoProperty[] = [];
    const pRe = new RegExp(PojoParser.PROPERTY_RE)
    let propertyMatch: RegExpMatchArray;
    while ((propertyMatch = pRe.exec(this.javaCode)) !== null) {
      const p: PojoProperty = {
        ...pick(propertyMatch.groups, 'desc', 'type', 'name'),
        isOptional: !propertyMatch[0].includes('@NotNull')
      }
      properties.push(p)
    }
    this.properties = properties;
  }

  private _getJSDoc() {
    let result = new RegExp(PojoParser.PROPERTY_RE).test(this.javaCode)
      ? this.properties.map(prop => {
        const {desc, name, type, isOptional} = prop
        const pName = isOptional ? ` [${name}]` : ` ${name}`
        const pDesc = desc ? ` - ${desc}` : ''
        return `* @property {${getJSType(type)}} ${pName}${pDesc}`.trim()
      }).join('\n ').trim()
      : '* @todo no property'
    result = `/**\n * @typedef {Object} ${this.className}\n ${result}\n*/`
    return formatParagraph(result);
  }

  // TODO ts
  parse(type: ParseType = 'jsdoc') {
    const rtn: ParseResult = {
      javaPath: this.javaPath,
      result: null
    }

    if (type === 'jsdoc') {
      rtn.result = this._getJSDoc()
    }

    return rtn;
  }
}

export default PojoParser;
