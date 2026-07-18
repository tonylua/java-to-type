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

interface ExtractedConstant {
  className: string
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

  const str = findStringLiteral(node)
  if (str) return str

  const num = findNumericLiteral(node)
  if (num) return num

  return ''
}

class ConstantVisitor extends (BaseJavaCstVisitorWithDefaults as any) {
  private className = ''
  private properties: EnumProperty[] = []
  private allComments: any[] = []

  constructor(comments: any[]) {
    super()
    this.allComments = comments
    this.validateVisitor()
  }

  getResult(): ExtractedConstant {
    return { className: this.className, properties: this.properties }
  }

  normalClassDeclaration(ctx: any) {
    const identifier =
      ctx.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image
    if (identifier) {
      this.className = identifier
    }
    super.normalClassDeclaration(ctx)
  }

  fieldDeclaration(ctx: any) {
    const modifiers = ctx.fieldModifier || []
    const isStatic = modifiers.some((m: any) => m.children?.Static?.[0]?.image === 'static')
    const isFinal = modifiers.some((m: any) => m.children?.Final?.[0]?.image === 'final')

    if (!isStatic || !isFinal) {
      super.fieldDeclaration(ctx)
      return
    }

    // 获取类型
    let typeStr = 'String'
    const unannType = ctx.unannType?.[0]
    if (unannType) {
      const refType = unannType.children?.unannReferenceType?.[0]
        ?.children?.unannClassOrInterfaceType?.[0]
      if (refType?.children?.Identifier?.[0]?.image) {
        typeStr = refType.children.Identifier[0].image
      }
    }

    const varDecl =
      ctx.variableDeclaratorList?.[0]?.children?.variableDeclarator?.[0]
    const varId = varDecl?.children?.variableDeclaratorId?.[0]
    const key = varId?.children?.Identifier?.[0]?.image
    const line = varId?.children?.Identifier?.[0]?.startLine

    if (!key) {
      super.fieldDeclaration(ctx)
      return
    }

    // 获取初始值
    let value = ''
    const init = varDecl?.children?.variableInitializer?.[0]
    if (init) {
      const expr = init.children?.expression?.[0]
      value = extractLiteralValue(expr)
    }

    // 查找注释
    const docComment = findDocComment(this.allComments, line)
    const desc = docComment ? extractCommentDescription(docComment) : ''

    this.properties.push({
      key,
      value,
      desc,
      type: typeStr,
    })

    super.fieldDeclaration(ctx)
  }
}

const ConstantParserAST: ParserContructor = class ConstantParserAST extends BaseParser {
  private extracted: ExtractedConstant = { className: '', properties: [] }

  static match(code: string): boolean {
    try {
      const cst = parseJavaToCST(code)
      let hasStaticFinalField = false

      class MatchVisitor extends (BaseJavaCstVisitorWithDefaults as any) {
        constructor() {
          super()
          this.validateVisitor()
        }
        fieldDeclaration(ctx: any) {
          const modifiers = ctx.fieldModifier || []
          const isStatic = modifiers.some((m: any) => m.children?.Static?.[0]?.image === 'static')
          const isFinal = modifiers.some((m: any) => m.children?.Final?.[0]?.image === 'final')
          if (isStatic && isFinal) {
            hasStaticFinalField = true
          }
          super.fieldDeclaration(ctx)
        }
      }

      new MatchVisitor().visit(cst)
      return hasStaticFinalField
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

    const visitor = new ConstantVisitor(allComments)
    visitor.visit(cst)
    this.extracted = visitor.getResult()
  }

  private _getJSDoc(): string {
    if (!this.extracted.className || !this.extracted.properties.length) return ''
    const enumType = this.extracted.properties[0]?.type || 'String'
    const props = this.extracted.properties
      .map((prop) => {
        const { desc, key, value } = prop
        const pVlu = value ? `: ${value}` : ''
        const pDesc = desc ? `// ${desc}` : ''
        return '  ' + `${key}${pVlu}, ${pDesc}`.trim()
      })
      .join('\n')
      .trim()

    let result = `export const ${this.extracted.className} = {\n  ${props}\n}\n`
    result = `/**\n * @readonly\n * @enum {${enumType}}\n */\n${result}`
    return result
  }

  private _getJSDocWithTS(): string {
    if (!this.extracted.className || !this.extracted.properties.length) return ''
    const props = this.extracted.properties
      .map((prop) => {
        const { desc, key, value } = prop
        const pVlu = value ? ` = ${value}` : ''
        const pDesc = desc ? `// ${desc}` : ''
        return '  ' + `${key}${pVlu}, ${pDesc}`.trim()
      })
      .join('\n')
      .trim()

    const result = `export enum ${this.extracted.className} {\n  ${props}\n}\n`
    // @ts-ignore
    global.dtsCache[this.extracted.className] = this.javaPath
    return result
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

export default ConstantParserAST
