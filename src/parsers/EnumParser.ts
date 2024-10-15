import { getJSType } from '../utils/type'
import { formatParagraph, replaceQuote } from '../utils/text'
import type {
  ParserMeta,
  ParserContructor,
  ParseResult,
  EnumProperty,
} from '../types/Parser'
import BaseParser from './BaseParser'

const EnumParser: ParserContructor = class EnumParser extends BaseParser {
  static INTERFACE_ENUMS = /(?<=public\sinterface)[\s\S]+?enum\s+(?<enum_name>\w+)/gm

  static ENUM_RE = /public\s+(?:interface|enum)\s+(?<enum_name>\w+)/g

  static PROPERTY_RE =
    /^\s+(?<key>[a-zA-Z_]+?)(?:\((?<value>\S+?)\s*(?:,\s*(?<desc>.+?))?\))?[,;]/gm 

  static match(code: string) {
    const { ENUM_RE, PROPERTY_RE } = EnumParser
    return new RegExp(ENUM_RE).test(code) && new RegExp(PROPERTY_RE).test(code)
  }

  private enumNames: string[]
  private properties: Record<string, EnumProperty[]>

  constructor(javaCode: string, javaPath: string, meta?: ParserMeta) {
    super(javaCode, javaPath, meta)
    this._getEnumNames()
    this._getProperties()
    return this
  }

  private _getEnumNames() {
    if (EnumParser.INTERFACE_ENUMS.test(this.javaCode)) {
      const iRe = new RegExp(/enum\s+(?<enum_name>\w+)/gm);
      let match, names = [];
      while ((match = iRe.exec(this.javaCode)) !== null) {
        names.push(match?.[1])
      }
      this.enumNames = names
    } else {
      const cRe = new RegExp(EnumParser.ENUM_RE)
      const classMatch: RegExpMatchArray = cRe.exec(this.javaCode)
      this.enumNames = [classMatch?.[1]] // classMatch?.groups?.enum_name;
    }
  }

  private _getProperties() {
    const properties: Record<string, EnumProperty[]> = {} 
    if (this.enumNames.length) { 
      this.enumNames.forEach((enumName, idx) => {
        const startIndex = this.javaCode.indexOf(`enum ${enumName}`);
        const endIndex = idx < this.enumNames.length - 1 
          ? this.javaCode.indexOf(`enum ${this.enumNames[idx + 1]}`) 
          : this.javaCode.length
        const scopeCode = this.javaCode.substring(startIndex, endIndex)
        properties[enumName] = []
        const pRe = new RegExp(EnumParser.PROPERTY_RE)
        let propertyMatch: RegExpMatchArray
        while ((propertyMatch = pRe.exec(scopeCode)) !== null) {
          const p: EnumProperty = {
            key: propertyMatch[1],
            value: propertyMatch[2],
            desc: propertyMatch[3],
          }
          p.type = /["']+/.test(p.value) ? 'String' : 'Number'
          properties[enumName].push(p)
        }
      })
    }
    this.properties = properties
  }

  private _getJSDocWithTS() {
    if (!this.enumNames.length) return '';
    const results: string[] = [];
    this.enumNames.forEach(enumName => {
      const props = this.properties[enumName]
      const enumType = getJSType(props[0].type, this.meta.outputTS)
      let result = props.length
        ? props.map((prop, propIdx) => {
            const { desc, key, value, type } = prop
            const pVlu = value ? ` = ${replaceQuote(value, `'`)}` : ``
            const pDesc = desc ? `// ${replaceQuote(desc)}` : ``
            return '  ' + `${key}${pVlu}, ${pDesc}`.trim()
          })
          .join('\n')
          .trim()
        : '/*TODO no property*/'
      result = `export enum ${enumName} {\n  ${result}\n}\n`
      results.push(formatParagraph(result))
      if (EnumParser.INTERFACE_ENUMS.test(this.javaCode)) {
        // TODO
      } else {
        global.dtsCache[enumName] = this.javaPath
      }
    })
    return results.join('\n\n');
  }

  private _getJSDoc() {
    if (!this.enumNames.length) return '';
    const results: string[] = [];
    this.enumNames.forEach(enumName => {
      const props = this.properties[enumName]
      const enumType = getJSType(props[0].type)
      let result = props.length
        ? props.map((prop, propIdx) => {
            const { desc, key, value, type } = prop
            const pVlu = value
              ? `: ${replaceQuote(value, `'`)}`
              : `: ${propIdx}`
            const pDesc = desc ? `// ${replaceQuote(desc)}` : ``
            return '  ' + `${key}${pVlu}, ${pDesc}`.trim()
          })
          .join('\n')
          .trim()
        : '* @todo no property'
      result = `export const ${enumName} = {\n  ${result}\n}\n`
      result = `/**\n * @readonly\n * @enum {${enumType}}\n */\n${result}`
      results.push(formatParagraph(result))
    })
    return results.join('\n\n');
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

export default EnumParser
