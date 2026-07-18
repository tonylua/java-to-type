import type {
  ParserMeta,
  ParserContructor,
  ParseResult,
  EnumProperty,
} from '../../types/Parser'
import {
  parseJavaToCST,
  extractComments,
  findDocComment,
  extractCommentDescription,
  BaseJavaCstVisitorWithDefaults,
} from './utils'
import BaseParser from '../BaseParser'

interface ExtractedEnum {
  name: string
  properties: EnumProperty[]
}

// 深度搜索 StringLiteral
function findStringLiteral(node: any): string {
  if (!node || typeof node !== 'object') return ''

  if (node.children?.StringLiteral?.[0]?.image) {
    return node.children.StringLiteral[0].image
  }

  for (const [key, val] of Object.entries(node.children || {})) {
    if (Array.isArray(val)) {
      for (const child of val) {
        const result = findStringLiteral(child)
        if (result) return result
      }
    }
  }
  return ''
}

// 深度搜索数字字面量（包括 integerLiteral 嵌套在 literal 中的情况）
function findNumericLiteral(node: any): string {
  if (!node || typeof node !== 'object') return ''

  // 直接 IntegerLiteral
  if (node.children?.IntegerLiteral?.[0]?.image) {
    return node.children.IntegerLiteral[0].image
  }
  if (node.children?.FloatingPointLiteral?.[0]?.image) {
    return node.children.FloatingPointLiteral[0].image
  }

  // 嵌套在 literal → integerLiteral → DecimalLiteral 中
  if (node.children?.literal?.[0]?.children?.integerLiteral?.[0]?.children?.DecimalLiteral?.[0]?.image) {
    return node.children.literal[0].children.integerLiteral[0].children.DecimalLiteral[0].image
  }

  for (const [key, val] of Object.entries(node.children || {})) {
    if (Array.isArray(val)) {
      for (const child of val) {
        const result = findNumericLiteral(child)
        if (result) return result
      }
    }
  }
  return ''
}

// 提取字面量值
function extractLiteralValue(node: any): string {
  if (!node) return ''

  // 尝试字符串
  const str = findStringLiteral(node)
  if (str) return str

  // 尝试数字
  const num = findNumericLiteral(node)
  if (num) return num

  return ''
}

class EnumVisitor extends (BaseJavaCstVisitorWithDefaults as any) {
  private enums: ExtractedEnum[] = []
  private allComments: any[] = []

  constructor(comments: any[]) {
    super()
    this.allComments = comments
    this.validateVisitor()
  }

  getResult() {
    return this.enums
  }

  enumDeclaration(ctx: any) {
    const name = ctx.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image
    if (!name) {
      super.enumDeclaration(ctx)
      return
    }

    const properties: EnumProperty[] = []
    const enumBody = ctx.enumBody?.[0]
    const enumConstList = enumBody?.children?.enumConstantList?.[0]
    const enumConstants = enumConstList?.children?.enumConstant || []

    enumConstants.forEach((ec: any) => {
      const key = ec.children?.Identifier?.[0]?.image
      const line = ec.children?.Identifier?.[0]?.startLine

      // 参数列表 (如 RED("#FF0000"))
      const argList = ec.children?.argumentList?.[0]
      const args = argList?.children?.expression || []
      let value = ''
      let desc = ''

      if (args[0]) {
        value = extractLiteralValue(args[0])
      }

      // 如果没找到值，使用 key 作为默认值
      if (!value) {
        value = key
      }

      // 查找注释
      const docComment = findDocComment(this.allComments, line)
      if (docComment) {
        desc = extractCommentDescription(docComment)
      }

      const type = /^["']/.test(value) ? 'String' : 'Number'

      properties.push({ key, value, desc, type })
    })

    this.enums.push({ name, properties })
    super.enumDeclaration(ctx)
  }
}

const EnumParserAST: ParserContructor = class EnumParserAST extends BaseParser {
  private enums: ExtractedEnum[] = []

  static match(code: string): boolean {
    try {
      const cst = parseJavaToCST(code)
      let hasEnum = false

      class MatchVisitor extends (BaseJavaCstVisitorWithDefaults as any) {
        constructor() {
          super()
          this.validateVisitor()
        }
        enumDeclaration() {
          hasEnum = true
        }
      }

      new MatchVisitor().visit(cst)
      return hasEnum
    } catch {
      return false
    }
  }

  constructor(javaCode: string, javaPath: string, meta?: ParserMeta) {
    super(javaCode, javaPath, meta)
    this._extract()
    return this
  }

  private _extract() {
    const cst = parseJavaToCST(this.javaCode)
    const allComments = extractComments(cst)

    const visitor = new EnumVisitor(allComments)
    visitor.visit(cst)
    this.enums = visitor.getResult()
  }

  private _getJSDoc(): string {
    return this.enums
      .map(e => {
        const props = e.properties.length
          ? e.properties
              .map((prop, idx) => {
                const { desc, key, value, type } = prop
                const pVlu = value !== key ? `: ${value}` : `: ${idx}`
                const pDesc = desc ? `// ${desc}` : ''
                return '  ' + `${key}${pVlu}, ${pDesc}`.trim()
              })
              .join('\n')
              .trim()
          : '* @todo no property'

        const enumType = e.properties[0]?.type || 'String'
        let result = `export const ${e.name} = {\n  ${props}\n}\n`
        result = `/**\n * @readonly\n * @enum {${enumType}}\n */\n${result}`
        return result
      })
      .join('\n\n')
  }

  private _getJSDocWithTS(): string {
    return this.enums
      .map(e => {
        const props = e.properties.length
          ? e.properties
              .map((prop) => {
                const { desc, key, value } = prop
                const pVlu = value !== key ? ` = ${value}` : ''
                const pDesc = desc ? `// ${desc}` : ''
                return '  ' + `${key}${pVlu}, ${pDesc}`.trim()
              })
              .join('\n')
              .trim()
          : '/*TODO no property*/'

        const result = `export enum ${e.name} {\n  ${props}\n}\n`
        // @ts-ignore
        global.dtsCache[e.name] = this.javaPath
        return result
      })
      .join('\n\n')
  }

  parse(): ParseResult {
    return {
      javaPath: this.javaPath,
      result: this.meta.outputTS
        ? this._getJSDocWithTS()
        : this._getJSDoc(),
    }
  }
}

export default EnumParserAST
