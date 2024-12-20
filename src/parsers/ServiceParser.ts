import { getOrImportType } from '../utils/type'
import { formatParagraph } from '../utils/text'
import type {
  ParserMeta,
  ParserContructor,
  ControllerType,
  ServiceType,
  ServiceParamType,
  ParseResult,
} from '../types/Parser'
import BaseParser from './BaseParser'

const ServiceParser: ParserContructor = class ServiceParser extends BaseParser {
  static CONTROLLER_RE =
    /@RestController\s*\n\s*@RequestMapping\(\"(?<url>[\w\/_-{}:]+?)\"\)[\s\S]*?\npublic\s+class\s+(?<name>\w+?)Controller\s+/g

  static SERVICE_RE =
    /(\/\*{2}\n\s+\*\s+(?<desc>[^@\s]*?)\n(?:[\s\S]+?))?@(?:(?<method>Get|Post|Update|Put|Delete)?)Mapping\(\s*(?:value\s*=\s*)?"(?<url>[\w\/_-{}:]+?)\".*?\)(?:[\s\S]+?)public\s+(?<res>[\w<>_[\](,\s)]+?)\s+(?<name>[\w_-]+?)\((?<params_str>[\s\S]*)\)?\s*{/gi

  static PARAM_RE =
    /(?<param_annotation>@.*?\s)?(?<param_type>[\w<>_[\](,\s)]+?)\s+(?<param_name>\w+)(?:,\s*)?/g

  static match(code: string) {
    const { CONTROLLER_RE, SERVICE_RE } = ServiceParser
    return (
      new RegExp(CONTROLLER_RE).test(code) && new RegExp(SERVICE_RE).test(code)
    )
  }

  private controller: ControllerType
  private services: ServiceType[]

  constructor(javaCode: string, javaPath: string, meta?: ParserMeta) {
    super(javaCode, javaPath, meta)
    this._getController()
    this._getServices()
    return this
  }

  private _getController() {
    const match = new RegExp(ServiceParser.CONTROLLER_RE).exec(this.javaCode)
    if (!match) throw new Error('invalid controller')
    // https://github.com/microsoft/TypeScript/issues/36132#issuecomment-573141594
    this.controller = { url: match[1], name: match[2] } // pick(match.groups, 'url', 'name');
  }

  private _getServices() {
    const services: ServiceType[] = []
    const sRe = new RegExp(ServiceParser.SERVICE_RE)
    let serviceMatch: RegExpMatchArray
    while ((serviceMatch = sRe.exec(this.javaCode)) !== null) {
      // const {params_str} = serviceMatch.groups;
      // console.log(Array.from(serviceMatch))
      const params_str = serviceMatch[7]
      const params: ServiceParamType[] = []
      const pRe = new RegExp(ServiceParser.PARAM_RE)
      let paramMatch: RegExpMatchArray
      const paramStr = (params_str || '')
        .replace(/[\n\r]/g, '')
        .replace(/\s+/g, ' ')
      // console.log(333, params_str, paramStr)
      while ((paramMatch = pRe.exec(paramStr)) !== null) {
        // const p: ServiceParamType = pick(paramMatch.groups,
        //   'param_type', 'param_name', 'param_annotation');
        const p: ServiceParamType = {
          param_annotation: paramMatch[1],
          param_type: paramMatch[2],
          param_name: paramMatch[3],
        }
        params.push(p)
      }
      const hasDesc = /\/\*\*/.test(serviceMatch[1])
      const s: ServiceType = {
        params,
        // ...pick(serviceMatch.groups, 'desc', 'method', 'url', 'res', 'name')
        desc: hasDesc ? serviceMatch[2] : '',
        method: serviceMatch[3],
        url: serviceMatch[4],
        res: serviceMatch[5],
        name: serviceMatch[6],
      }
      // console.log(Array.prototype.slice.call(serviceMatch, 0, 7), s)
      services.push(s)
    }
    this.services = services
  }

  private _renderServices(service: ServiceType) {
    const url = `${this.controller.url}${service.url}`.replace(/\/+/g, '/')
    const reqUrl = service.params.reduce(
      (acc, param) => {
        const { param_name, param_annotation: pa } = param
        const placeholder = `{${param_name}}`
        if (pa?.includes('PathVariable') && acc.includes(placeholder)) {
          acc = acc.replace(placeholder, `$${placeholder}`)
        }
        return acc
      },
      '`' + (this.meta?.apiPrefix || '') + url + '`',
    )
    const funcName = url
      .replace(/\/{\w+?}/g, '') // placeholder
      .replace(/\/(\w)/g, (_, p1) => p1.toUpperCase())
      .replace(/^\w/, m => m.toLowerCase())
    const jsdocParams = service.params
      .map(param => {
        const { param_type: pt, param_name: pn, param_annotation: pa } = param
        const isHeader = pa?.includes('RequestHeader')
        const isOptional = !pa || !pa.includes('@NotNull')
        const pName = isHeader ? `headers.${pn}` : pn
        const name = isOptional ? ` [${pName}]` : ` ${pName}`
        return `* @param {${getOrImportType(pt, this.meta)}} ${name}`.trim()
      })
      .join('\n ')
      .trim()
    const mapParams = (param: ServiceParamType) => {
      const { param_name: pn, param_annotation: pa } = param
      const isHeader = pa?.includes('RequestHeader')
      return isHeader ? null : pn
    }
    const funcArgs = service.params.map(mapParams).filter(Boolean).join(', ')
    const bodyOrParams = service.params
      .filter(({ param_annotation: pa }) => !pa || !pa.includes('PathVariable'))
      .map(mapParams)
      .filter(Boolean)
      .map(param =>
        this.javaCode.includes('ResponseBody') ? `...${param}` : param,
      )
    // console.log(service.name, service.method)

    let mtd = service.method.toLowerCase()
    const paramsKey = /(post|put|patch|delete)/.test(mtd) ? 'body' : 'params'
    const data = bodyOrParams.length
      ? `${paramsKey}: {
      ${bodyOrParams.join(',\n      ')}
    }`
      : ''

    return `/** ${service.desc} ${funcName}
 * @url ${url}
 * @method ${mtd.toUpperCase()}
 ${jsdocParams}
 * @return {Promise<${getOrImportType(service.res, this.meta)}>}\n */\n
export function ${funcName} (${funcArgs}) {
  return ${this.meta.jsDocServiceRequestInstanceName}({
    url: ${reqUrl},
    method: '${mtd}',
    ${data}
  })
}
  `
  }

  private _getJSDoc() {
    const cont = formatParagraph(
      this.services.map(this._renderServices.bind(this)).join('\n').trim(),
    )
    return `${this.meta.jsDocServiceTopImport}\n\n${cont}`
  }

  parse() {
    const rtn: ParseResult = {
      javaPath: this.javaPath,
      result: null,
    }
    // TODO ts
    if (this.meta.outputTS) 
      throw new Error('ServiceParser with outputTS not support now')

    rtn.result = this._getJSDoc()

    return rtn
  }
}

export default ServiceParser
