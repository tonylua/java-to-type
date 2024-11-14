import { getJSType } from '../utils/type'
import { formatParagraph } from '../utils/text'
import type {
  ParserMeta,
  ParserContructor,
  ParseResult,
  PojoProperty,
} from '../types/Parser'
import BaseParser from './BaseParser'

type TNestedStaticClassResult = {
  startLine: number
  endLine: number
  className: string
}

const PojoParser: ParserContructor = class PojoParser extends BaseParser {
  static CLASS_RE = /public\s+class\s+(?<class_name>\w+)/g

  // TODO 通过 getter/setter 判断是否只读? springboot @data注解?
  static PROPERTY_RE =
    /(?:\n(?:[^\n\S]|\t)+\/\*{2}\s*\n\s*\*\s+(?<desc>(?:[^@].+)?)[\s\S]*?)?private\s+(?<type>[\w<>[\]]+)\s+(?<name>\w+);/g

  static match(code: string) {
    const { CLASS_RE, PROPERTY_RE } = PojoParser
    return new RegExp(CLASS_RE).test(code) && new RegExp(PROPERTY_RE).test(code)
  }

  static NESTED_STATIC_CLASS_RE =
    /public\s+static\s+class\s+(?<class_name>\w+).*?{/g

  static matchNestedStaticClasses(
    javaCode: string,
  ): TNestedStaticClassResult[] {
    const matches = []
    let match: RegExpExecArray | null
    while (
      (match = PojoParser.NESTED_STATIC_CLASS_RE.exec(javaCode)) !== null
    ) {
      const className = match[1] // match.groups?.class_name
      if (className) {
        const startIndex = match.index // { 的位置
        let braceCount = 1 // 初始 { 计数
        let currentIndex = startIndex + 1
        while (currentIndex < javaCode.length && braceCount > 0) {
          const currentChar = javaCode[currentIndex]
          if (currentChar === '{') {
            braceCount++
          } else if (currentChar === '}') {
            braceCount--
          }
          currentIndex++
        }
        if (braceCount === 0) {
          const endIndex = currentIndex - 1 // 最后一个 } 的位置
          // 计算起始行和结束行
          const startLine = javaCode.substring(0, startIndex).split('\n').length
          const endLine = javaCode.substring(0, endIndex).split('\n').length
          matches.push({ startLine, endLine, className })
        }
      }
    }
    return matches?.length ? matches : null
  }

  static extractSubclass(
    javaCode: string,
    startLine: number,
    endLine: number,
  ): string {
    const lines = javaCode.split('\n')
    const subclassLines = lines.slice(startLine - 1, endLine)
    return subclassLines.join('\n')
  }

  static deleteSubclass(
    javaCode: string,
    startLine: number,
    endLine: number,
  ): string {
    const lines = javaCode.split('\n')
    lines.splice(startLine - 1, endLine - startLine + 1)
    return lines.join('\n')
  }

  private className: string
  private properties: PojoProperty[]

  constructor(javaCode: string, javaPath: string, meta?: ParserMeta) {
    super(javaCode, javaPath, meta)
    this._getClassName()
    this._getProperties()
    return this
  }

  private _getClassName() {
    const cRe = new RegExp(PojoParser.CLASS_RE)
    const classMatch: RegExpMatchArray = cRe.exec(this.javaCode)
    this.className = classMatch[1] // classMatch?.groups?.class_name;
  }

  private _getProperties() {
    const properties: PojoProperty[] = []
    const pRe = new RegExp(PojoParser.PROPERTY_RE)
    let propertyMatch: RegExpMatchArray
    while ((propertyMatch = pRe.exec(this.javaCode)) !== null) {
      const p: PojoProperty = {
        // ...pick(propertyMatch.groups, 'desc', 'type', 'name'),
        desc: propertyMatch[1],
        type: propertyMatch[2],
        name: propertyMatch[3],
        isOptional: !propertyMatch[0].includes('@NotNull'),
      }
      properties.push(p)
    }
    this.properties = properties
  }

  private _getJSDoc() {
    let result = new RegExp(PojoParser.PROPERTY_RE).test(this.javaCode)
      ? this.properties
          .map(prop => {
            const { desc, name, type, isOptional } = prop
            const pName = isOptional ? ` [${name}]` : ` ${name}`
            const pDesc = desc ? ` - ${desc}` : ''
            return `* @property {${getJSType(type)}} ${pName}${pDesc}`.trim()
          })
          .join('\n ')
          .trim()
      : '* @todo no property'
    result = `/**\n * @typedef {Object} ${this.className}\n ${result}\n*/`
    return formatParagraph(result)
  }

  private _getJSDocWithTS() {
    let result = new RegExp(PojoParser.PROPERTY_RE).test(this.javaCode)
      ? this.properties
          .map(prop => {
            const { desc, name, type, isOptional } = prop
            const pType = getJSType(type, this.meta.outputTS)
            const pOptional = isOptional ? `?` : ``
            const pDesc = desc ? ` // ${desc}` : ''
            return `${name}${pOptional}: ${pType};${pDesc}`.trim()
          })
          .join('\n ')
          .trim()
      : '/*TODO no property*/'
    result = `export type ${this.className} = {\n ${result}\n}\n`
    global.dtsCache[this.className] = this.javaPath
    return formatParagraph(result)
  }

  parse() {
    const rtn: ParseResult = {
      javaPath: this.javaPath,
      result: null,
    }

    rtn.result = this.meta.outputTS ? this._getJSDocWithTS() : this._getJSDoc()

    return rtn
  }
}

export default PojoParser
