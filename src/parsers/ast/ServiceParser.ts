import type {
  ParserMeta,
  ParserContructor,
  ParseResult,
  ControllerType,
  ServiceType,
  ServiceParamType,
} from '../../types/Parser'
import {
  parseJavaToCST,
  extractComments,
  findDocComment,
  extractCommentDescription,
  getTypeImage,
  BaseJavaCstVisitorWithDefaults,
} from './utils'
import BaseParser from '../BaseParser'

interface ExtractedService {
  controller: ControllerType
  services: ServiceType[]
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

class ServiceVisitor extends (BaseJavaCstVisitorWithDefaults as any) {
  private controller: ControllerType = { url: '', name: '' }
  private services: ServiceType[] = []
  private allComments: any[] = []

  constructor(comments: any[]) {
    super()
    this.allComments = comments
    this.validateVisitor()
  }

  getResult(): ExtractedService {
    return { controller: this.controller, services: this.services }
  }

  classDeclaration(ctx: any) {
    // 类修饰符在 classDeclaration 里，不是 normalClassDeclaration
    const modifiers = ctx.classModifier || []
    modifiers.forEach((mod: any) => {
      const ann = mod.children?.annotation?.[0]
      if (!ann) return
      const annName = ann.children?.typeName?.[0]?.children?.Identifier?.[0]?.image

      if (annName === 'RequestMapping') {
        // 尝试直接提取字符串值
        const str = findStringLiteral(ann)
        if (str) {
          this.controller.url = str.replace(/"/g, '')
          return
        }
        // 尝试从 elementValuePairList 提取
        const args = ann.children?.elementValuePairList?.[0]?.children?.elementValuePair || []
        args.forEach((arg: any) => {
          const key = arg.children?.Identifier?.[0]?.image
          const value = findStringLiteral(arg.children?.elementValue?.[0])
          if (key === 'value' && value) {
            this.controller.url = value.replace(/"/g, '')
          }
        })
      }
    })
    super.classDeclaration(ctx)
  }

  normalClassDeclaration(ctx: any) {
    const className = ctx.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image
    this.controller.name = className?.replace(/Controller$/, '') || ''
    super.normalClassDeclaration(ctx)
  }

  methodDeclaration(ctx: any) {
    const methodHeader = ctx.methodHeader?.[0]
    const methodNameToken = methodHeader?.children?.methodDeclarator?.[0]?.children?.Identifier?.[0]
    const methodName = methodNameToken?.image

    // 获取返回类型
    let returnType = 'void'
    const result = methodHeader?.children?.result?.[0]
    if (result) {
      const unannType = result.children?.unannType?.[0]
      if (unannType) {
        const refType = unannType.children?.unannReferenceType?.[0]?.children?.unannClassOrInterfaceType?.[0]
        // 尝试 unannClassType
        const classType = refType?.children?.unannClassType?.[0]
        if (classType?.children?.Identifier?.[0]?.image) {
          returnType = classType.children.Identifier[0].image
          // 处理泛型
          const typeArgs = classType.children?.typeArguments?.[0]
          if (typeArgs) {
            const innerTypes = typeArgs.children?.typeArgumentList?.[0]?.children?.typeArgument || []
            if (innerTypes.length > 0) {
              // classOrInterfaceType → classType → Identifier
              const innerClassType = innerTypes[0].children?.referenceType?.[0]
                ?.children?.classOrInterfaceType?.[0]
                ?.children?.classType?.[0]
              const inner = innerClassType?.children?.Identifier?.[0]?.image
              if (inner) returnType = `${returnType}<${inner}>`
            }
          }
        } else if (refType?.children?.Identifier?.[0]?.image) {
          // 直接 Identifier
          returnType = refType.children.Identifier[0].image
        }
      }
    }

    // 提取方法注解
    const methodModifiers = ctx.methodModifier || []
    let method = 'GET'
    let url = ''
    let desc = ''

    methodModifiers.forEach((mod: any) => {
      const ann = mod.children?.annotation?.[0]
      if (!ann) return
      const annName = ann.children?.typeName?.[0]?.children?.Identifier?.[0]?.image

      if (annName === 'GetMapping') method = 'GET'
      else if (annName === 'PostMapping') method = 'POST'
      else if (annName === 'PutMapping') method = 'PUT'
      else if (annName === 'DeleteMapping') method = 'DELETE'
      else if (annName === 'PatchMapping') method = 'PATCH'

      if (annName?.endsWith('Mapping')) {
        // 尝试直接提取 URL
        const str = findStringLiteral(ann)
        if (str) {
          url = str.replace(/"/g, '')
        } else {
          // 尝试从 elementValuePairList 提取
          const args = ann.children?.elementValuePairList?.[0]?.children?.elementValuePair || []
          args.forEach((arg: any) => {
            const key = arg.children?.Identifier?.[0]?.image
            const value = findStringLiteral(arg.children?.elementValue?.[0])
            if (key === 'value' && value) {
              url = value.replace(/"/g, '')
            }
          })
        }
      }

      // 处理 @RequestMapping(method = RequestMethod.POST)
      if (annName === 'RequestMapping') {
        // 先尝试直接提取 URL
        const str = findStringLiteral(ann)
        if (str) {
          url = str.replace(/"/g, '')
        }
        // 然后处理 elementValuePairList (URL 可能也在里面，或者还有 method 参数)
        const args = ann.children?.elementValuePairList?.[0]?.children?.elementValuePair || []
        args.forEach((arg: any) => {
          const key = arg.children?.Identifier?.[0]?.image
          const value = findStringLiteral(arg.children?.elementValue?.[0])
          if (key === 'value' && value) {
            url = value.replace(/"/g, '')
          }
          // 提取 method 参数 - 搜索整个子树中的 HTTP 方法名
          if (key === 'method') {
            const elementValue = arg.children?.elementValue?.[0]
            // 深度搜索 GET/POST/PUT/DELETE/PATCH
            const methodStr = JSON.stringify(elementValue)
            if (methodStr.includes('POST')) method = 'POST'
            else if (methodStr.includes('PUT')) method = 'PUT'
            else if (methodStr.includes('DELETE')) method = 'DELETE'
            else if (methodStr.includes('PATCH')) method = 'PATCH'
            else if (methodStr.includes('GET')) method = 'GET'
          }
        })
      }
    })

    // 提取注释
    const line = methodNameToken?.startLine || 0
    const docComment = findDocComment(this.allComments, line, 3) // max distance 3 lines
    if (docComment) {
      desc = extractCommentDescription(docComment)
    }

    // 提取参数
    const params: ServiceParamType[] = []
    const formalParams = methodHeader?.children?.methodDeclarator?.[0]?.children?.formalParameterList?.[0]
    const paramList = formalParams?.children?.formalParameter || []

    paramList.forEach((param: any) => {
      // 参数可能在 variableParaRegularParameter 里
      const regularParam = param.children?.variableParaRegularParameter?.[0] || param
      const paramModifiers = regularParam.children?.variableModifier || []
      let paramAnnotation = ''

      paramModifiers.forEach((mod: any) => {
        const ann = mod.children?.annotation?.[0]
        if (ann) {
          const annName = ann.children?.typeName?.[0]?.children?.Identifier?.[0]?.image
          paramAnnotation = `@${annName}`
        }
      })

      const unannType = regularParam.children?.unannType?.[0]
      const paramType = unannType ? getTypeImage(unannType) : 'Object'

      const paramName = regularParam.children?.variableDeclaratorId?.[0]?.children?.Identifier?.[0]?.image || ''

      params.push({
        param_annotation: paramAnnotation,
        param_type: paramType,
        param_name: paramName,
      })
    })

    if (methodName && url) {
      this.services.push({
        desc: desc || methodName,
        method,
        url,
        res: returnType,
        name: methodName,
        params,
      })
    }

    super.methodDeclaration(ctx)
  }
}

const ServiceParserAST: ParserContructor = class ServiceParserAST extends BaseParser {
  private controller: ControllerType = { url: '', name: '' }
  private services: ServiceType[] = []

  static match(code: string): boolean {
    try {
      const cst = parseJavaToCST(code)
      let hasController = false
      let hasMapping = false

      class MatchVisitor extends (BaseJavaCstVisitorWithDefaults as any) {
        constructor() {
          super()
          this.validateVisitor()
        }
        annotation(ctx: any) {
          const name = ctx.typeName?.[0]?.children?.Identifier?.[0]?.image
          if (name === 'RestController' || name === 'Controller') {
            hasController = true
          }
          if (name?.endsWith('Mapping')) {
            hasMapping = true
          }
          super.annotation(ctx)
        }
      }

      new MatchVisitor().visit(cst)
      return hasController && hasMapping
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

    const visitor = new ServiceVisitor(allComments)
    visitor.visit(cst)
    const result = visitor.getResult()
    this.controller = result.controller
    this.services = result.services
  }

  private _mapType(javaType: string): string {
    const map: Record<string, string> = {
      String: 'String',
      Integer: 'Number',
      int: 'Number',
      Long: 'Number',
      long: 'Number',
      Double: 'Number',
      double: 'Number',
      Float: 'Number',
      float: 'Number',
      Boolean: 'Boolean',
      boolean: 'Boolean',
      void: 'undefined',
      List: 'Array',
      Map: 'Object',
      PageInfo: 'PageInfo',
    }

    const genericMatch = javaType.match(/(\w+)<(.+?)>/)
    if (genericMatch) {
      const base = map[genericMatch[1]] || genericMatch[1]
      const inner = map[genericMatch[2]] || genericMatch[2]
      return `${base}.<${inner}>`
    }

    return map[javaType] || javaType
  }

  // TypeScript 类型映射：List<T> → T[], Map → Record, 基本类型小写
  private _mapTypeTS(javaType: string): string {
    const map: Record<string, string> = {
      String: 'string',
      char: 'string',
      Character: 'string',
      Date: 'string',
      LocalDate: 'string',
      LocalDateTime: 'string',
      Integer: 'number',
      int: 'number',
      Long: 'number',
      long: 'number',
      Double: 'number',
      double: 'number',
      Float: 'number',
      float: 'number',
      short: 'number',
      Short: 'number',
      byte: 'number',
      Byte: 'number',
      BigDecimal: 'number',
      Boolean: 'boolean',
      boolean: 'boolean',
      void: 'void',
    }

    // List<T> / Set<T> / Collection<T> → T[]
    const listMatch = javaType.match(/(?:List|Set|Collection)<(.+)>$/)
    if (listMatch) {
      return `${this._mapTypeTS(listMatch[1])}[]`
    }

    // Map<K, V> → Record<K, V>
    const mapMatch = javaType.match(/Map<(.+?),\s*(.+)>$/)
    if (mapMatch) {
      return `Record<${this._mapTypeTS(mapMatch[1])}, ${this._mapTypeTS(mapMatch[2])}>`
    }

    // 其它泛型 Wrapper<T> → Wrapper<mapped T>
    const genericMatch = javaType.match(/(\w+)<(.+)>$/)
    if (genericMatch) {
      return `${genericMatch[1]}<${this._mapTypeTS(genericMatch[2])}>`
    }

    return map[javaType] || javaType
  }

  private _renderService(service: ServiceType): string {
    const url = `${this.controller.url}${service.url}`.replace(/\/+/g, '/')
    const funcName = url
      .replace(/\/{\w+?}/g, '')
      .replace(/\/(\w)/g, (_, p1) => p1.toUpperCase())
      .replace(/^\w/, (m) => m.toLowerCase())

    const jsdocParams = service.params
      .map((p) => {
        const { param_type: pt, param_name: pn, param_annotation: pa } = p
        const isHeader = pa?.includes('RequestHeader')
        const isOptional = !pa || !pa.includes('NotNull')
        const pName = isHeader ? `headers.${pn}` : pn
        const name = isOptional ? ` [${pName}]` : ` ${pName}`
        return `* @param {${this._mapType(pt)}} ${name}`.trim()
      })
      .join('\n ')
      .trim()

    const funcArgs = service.params
      .filter((p) => !p.param_annotation?.includes('RequestHeader'))
      .map((p) => p.param_name)
      .join(', ')

    const mtd = service.method.toLowerCase()

    return `/** ${service.desc} ${funcName}
 * @url ${url}
 * @method ${service.method}
 ${jsdocParams}
 * @return {Promise<${this._mapType(service.res)}>}
 */

export function ${funcName}(${funcArgs}) {
  return ${this.meta.jsDocServiceRequestInstanceName}({
    url: \`${url}\`,
    method: '${mtd}',
  })
}`
  }

  private _renderServiceTS(service: ServiceType): string {
    const url = `${this.controller.url}${service.url}`.replace(/\/+/g, '/')
    const funcName = url
      .replace(/\/{\w+?}/g, '')
      .replace(/\/(\w)/g, (_, p1) => p1.toUpperCase())
      .replace(/^\w/, (m) => m.toLowerCase())

    // 非 header 参数作为函数入参，带类型标注
    const argParams = service.params.filter(
      (p) => !p.param_annotation?.includes('RequestHeader'),
    )
    const funcArgs = argParams
      .map((p) => {
        const isOptional = !p.param_annotation || !p.param_annotation.includes('NotNull')
        return `${p.param_name}${isOptional ? '?' : ''}: ${this._mapTypeTS(p.param_type)}`
      })
      .join(', ')

    const mtd = service.method.toLowerCase()
    const resType = this._mapTypeTS(service.res)
    const descLine = service.desc ? `/** ${service.desc} */\n` : ''

    return `${descLine}export function ${funcName}(${funcArgs}): Promise<${resType}> {
  return ${this.meta.jsDocServiceRequestInstanceName}({
    url: \`${url}\`,
    method: '${mtd}',
  })
}`
  }

  private _getJSDoc(): string {
    const cont = this.services
      .map((s) => this._renderService(s))
      .join('\n')
      .trim()
    return `${this.meta.jsDocServiceTopImport}\n\n${cont}`
  }

  private _getTS(): string {
    const cont = this.services
      .map((s) => this._renderServiceTS(s))
      .join('\n\n')
      .trim()
    return `${this.meta.jsDocServiceTopImport}\n\n${cont}`
  }

  parse(): ParseResult {
    return {
      javaPath: this.javaPath,
      result: this.meta.outputTS ? this._getTS() : this._getJSDoc(),
    }
  }
}

export default ServiceParserAST
