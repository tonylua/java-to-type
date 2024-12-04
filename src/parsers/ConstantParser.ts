import { getJSType } from '../utils/type'
import { formatParagraph, replaceQuote } from '../utils/text'
import type {
  ParserMeta,
  ParserContructor,
  ParseResult,
  EnumProperty,
} from '../types/Parser'
import BaseParser from './BaseParser'

// eslint-disable-next-line max-len
const ConstantParser: ParserContructor = class ConstantParser extends BaseParser {
  static ENUM_RE = /public\s+class\s+(?<enum_name>\w+)/g

  static PROPERTY_RE =
    /(?:\s*\/\*{2}\n\s*\*\s+([^@\s]+?)\n[\s\S]+?)?public\sstatic\sfinal\s([\w<>[\]]+)\s+([\w_]+)\s*=\s*([\'\"]?.*[\'\"]?);/g

  static match(code: string) {
    const { ENUM_RE, PROPERTY_RE } = ConstantParser
    return new RegExp(ENUM_RE).test(code) && new RegExp(PROPERTY_RE).test(code)
  }

  private enumName: string
  private properties: EnumProperty[]

  constructor(javaCode: string, javaPath: string, meta?: ParserMeta) {
    super(javaCode, javaPath, meta)
    this._getEnumName()
    this._getProperties()
    return this
  }

  private _getEnumName() {
    const cRe = new RegExp(ConstantParser.ENUM_RE)
    const classMatch: RegExpMatchArray = cRe.exec(this.javaCode)
    this.enumName = classMatch[1] // classMatch?.groups?.enum_name;
  }

  private _getProperties() {
    const properties: EnumProperty[] = []
    const pRe = new RegExp(ConstantParser.PROPERTY_RE)
    let propertyMatch: RegExpMatchArray
    while ((propertyMatch = pRe.exec(this.javaCode)) !== null) {
      const p: EnumProperty = {
        desc: propertyMatch[1],
        type: propertyMatch[2],
        key: propertyMatch[3],
        value: propertyMatch[4],
      }
      properties.push(p)
    }
    this.properties = properties
  }

  private _getJSDocWithTS() {
    if (!this.properties.length) return ''
    const enumType = getJSType(this.properties[0].type, this.meta.outputTS)
    let result = new RegExp(ConstantParser.PROPERTY_RE).test(this.javaCode)
      ? this.properties
          .map((prop, propIdx) => {
            const { desc, key, value } = prop
            const pVlu = value ? ` = ${replaceQuote(value, `'`)}` : ``
            const pDesc = desc ? `// ${replaceQuote(desc)}` : ``
            return '  ' + `${key}${pVlu}, ${pDesc}`.trim()
          })
          .join('\n')
          .trim()
      : '/*TODO no property*/'
    result = `export enum ${this.enumName} {\n  ${result}\n}\n`
    global.dtsCache[this.enumName] = this.javaPath
    return formatParagraph(result)
  }

  private _getJSDoc() {
    if (!this.properties.length) return ''
    const enumType = getJSType(this.properties[0].type)
    let result = new RegExp(ConstantParser.PROPERTY_RE).test(this.javaCode)
      ? this.properties
          .map((prop, propIdx) => {
            const { desc, key, value } = prop
            const pVlu = value
              ? `: ${replaceQuote(value, `'`)}`
              : `: ${propIdx}`
            const pDesc = desc ? `// ${replaceQuote(desc)}` : ``
            return '  ' + `${key}${pVlu}, ${pDesc}`.trim()
          })
          .join('\n')
          .trim()
      : '* @todo no property'
    result = `export const ${this.enumName} = {\n  ${result}\n}\n`
    result = `/**\n * @readonly\n * @enum {${enumType}}\n */\n${result}`
    return formatParagraph(result)
  }

  parse() {
    const rtn: ParseResult = {
      javaPath: this.javaPath,
      result: null,
    }

    rtn.result = this.meta.outputTS
      ? this._getJSDocWithTS()
      : this._getJSDoc()

    return rtn
  }
}

export default ConstantParser
