import type {
  ParserMeta,
  ParserContructor,
  ParseResult,
  PojoProperty,
} from '../../types/Parser'
import {
  parseJavaToCST,
  extractComments,
  findDocComment,
  extractCommentDescription,
  hasAnnotation,
  getTypeImage,
  BaseJavaCstVisitorWithDefaults,
} from './utils'
import BaseParser from '../BaseParser'

interface ExtractedField {
  name: string
  type: string
  desc: string
  isOptional: boolean
  line: number
}

interface ExtractedClass {
  className: string
  fields: ExtractedField[]
}

// 从单个 fieldDeclaration 节点提取字段（不递归进嵌套类）
function extractField(
  fieldDecl: any,
  allComments: any[],
): ExtractedField | null {
  const ctx = fieldDecl.children
  const typeStr = getTypeImage(ctx.unannType?.[0])
  const varDecl =
    ctx.variableDeclaratorList?.[0]?.children?.variableDeclarator?.[0]
  const varId = varDecl?.children?.variableDeclaratorId?.[0]
  const name = varId?.children?.Identifier?.[0]?.image
  const line = varId?.children?.Identifier?.[0]?.startLine

  if (!name) return null

  const modifiers = ctx.fieldModifier || []
  const isOptional = !hasAnnotation(modifiers, 'NotNull')

  const docComment = findDocComment(allComments, line)
  const desc = docComment ? extractCommentDescription(docComment) : ''

  return { name, type: typeStr, desc, isOptional, line }
}

// 从 recordDeclaration 提取（record 组件都是必填字段）
function extractRecord(
  recordDecl: any,
  allComments: any[],
): ExtractedClass | null {
  const className =
    recordDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image
  if (!className) return null

  const comps =
    recordDecl.children?.recordHeader?.[0]?.children?.recordComponentList?.[0]
      ?.children?.recordComponent || []

  const fields: ExtractedField[] = comps
    .map((comp: any) => {
      const name = comp.children?.Identifier?.[0]?.image
      if (!name) return null
      const type = getTypeImage(comp.children?.unannType?.[0])
      const line = comp.children?.Identifier?.[0]?.startLine
      const docComment = findDocComment(allComments, line)
      const desc = docComment ? extractCommentDescription(docComment) : ''
      // record 组件是不可变的必填字段，非可选
      return { name, type, desc, isOptional: false, line }
    })
    .filter(Boolean) as ExtractedField[]

  return { className, fields }
}

// 递归处理一个 normalClassDeclaration 节点，收集本类字段 + 嵌套类
function collectClasses(
  normalClassDecl: any,
  allComments: any[],
  out: ExtractedClass[],
) {
  const className =
    normalClassDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image
  if (!className) return

  const fields: ExtractedField[] = []
  const bodyDecls =
    normalClassDecl.children?.classBody?.[0]?.children?.classBodyDeclaration || []

  const nestedClassDecls: any[] = []

  bodyDecls.forEach((bd: any) => {
    const member = bd.children?.classMemberDeclaration?.[0]
    if (!member) return

    // 直接字段
    const fieldDecl = member.children?.fieldDeclaration?.[0]
    if (fieldDecl) {
      const f = extractField(fieldDecl, allComments)
      if (f) fields.push(f)
    }

    // 嵌套类（static class Xxx）
    const nestedClass = member.children?.classDeclaration?.[0]
      ?.children?.normalClassDeclaration?.[0]
    if (nestedClass) {
      nestedClassDecls.push(nestedClass)
    }
  })

  out.push({ className, fields })

  // 递归处理嵌套类
  nestedClassDecls.forEach(nc => collectClasses(nc, allComments, out))
}

const PojoParserAST: ParserContructor = class PojoParserAST extends BaseParser {
  private classes: ExtractedClass[] = []

  static match(code: string): boolean {
    try {
      const cst = parseJavaToCST(code)
      let hasClass = false

      class MatchVisitor extends (BaseJavaCstVisitorWithDefaults as any) {
        constructor() {
          super()
          this.validateVisitor()
        }
        normalClassDeclaration() {
          hasClass = true
        }
        recordDeclaration() {
          hasClass = true
        }
      }

      new MatchVisitor().visit(cst)
      return hasClass
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

    // 找到顶层类声明
    const typeDecls =
      cst.children?.ordinaryCompilationUnit?.[0]?.children?.typeDeclaration || []
    const out: ExtractedClass[] = []
    typeDecls.forEach((td: any) => {
      const classDecl = td.children?.classDeclaration?.[0]
      // 普通类
      const normalClass = classDecl?.children?.normalClassDeclaration?.[0]
      if (normalClass) {
        collectClasses(normalClass, allComments, out)
        return
      }
      // record
      const recordDecl = classDecl?.children?.recordDeclaration?.[0]
      if (recordDecl) {
        const rec = extractRecord(recordDecl, allComments)
        if (rec) out.push(rec)
      }
    })
    this.classes = out
  }

  private _mapType(javaType: string, isTS = false): string {
    const map: Record<string, string> = {
      String: 'string',
      Integer: 'number',
      int: 'number',
      Long: 'number',
      long: 'number',
      Double: 'number',
      double: 'number',
      Float: 'number',
      float: 'number',
      Boolean: 'boolean',
      boolean: 'boolean',
      Date: 'string',
      LocalDate: 'string',
      LocalDateTime: 'string',
      BigDecimal: 'number',
    }

    // List<X> / Set<X> → 数组
    const listMatch = javaType.match(/(?:List|Set|Collection)<(\w+)>/)
    if (listMatch) {
      const itemType = map[listMatch[1]] || listMatch[1]
      return isTS ? `${itemType}[]` : `Array.<${itemType}>`
    }

    // Map<K, V> → Object
    if (/^Map</.test(javaType)) {
      return isTS ? 'Record<string, any>' : 'Object'
    }

    return map[javaType] || javaType
  }

  private _renderJSDoc(cls: ExtractedClass): string {
    const propsDoc = cls.fields.length
      ? cls.fields
          .map(prop => {
            const { desc, name, type, isOptional } = prop
            const pName = isOptional ? ` [${name}]` : ` ${name}`
            const pDesc = desc ? ` - ${desc}` : ''
            return `* @property {${this._mapType(type)}} ${pName}${pDesc}`.trim()
          })
          .join('\n ')
          .trim()
      : '* @todo no property'
    return `/**\n * @typedef {Object} ${cls.className}\n ${propsDoc}\n*/`
  }

  private _renderTS(cls: ExtractedClass): string {
    const propsDoc = cls.fields.length
      ? cls.fields
          .map(prop => {
            const { desc, name, type, isOptional } = prop
            const pType = this._mapType(type, true)
            const pOptional = isOptional ? `?` : ``
            const pDesc = desc ? ` // ${desc}` : ''
            return `${name}${pOptional}: ${pType};${pDesc}`.trim()
          })
          .join('\n ')
          .trim()
      : '/*TODO no property*/'
    // @ts-ignore
    global.dtsCache[cls.className] = this.javaPath
    return `export type ${cls.className} = {\n ${propsDoc}\n}\n`
  }

  parse(): ParseResult {
    if (!this.classes.length) {
      return { javaPath: this.javaPath, result: '' }
    }
    const result = this.meta.outputTS
      ? this.classes.map(c => this._renderTS(c)).join('\n\n')
      : this.classes.map(c => this._renderJSDoc(c)).join('\n\n')
    return { javaPath: this.javaPath, result }
  }
}

export default PojoParserAST
