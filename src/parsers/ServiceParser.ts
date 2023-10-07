import pick from 'lodash-es/pick'
import {IParser, ParserContructor} from "./Parser.d";

type ControllerType = {
  url: string;
  name: string
}

type ParamType = {
  param_annotation?: string;
  param_type: string;
  param_name: string
}

type ServiceType = {
  desc?: string;
  method: string;
  url: string;
  res: string;
  name: string;
  params: ParamType[]
}

const ServiceParser: ParserContructor = class ServiceParser implements IParser {
  static ControllerRe = /@RestController\s*\n\s*@RequestMapping\(\"(?<url>[\w\/_-{}:]+?)\"\)\s*\npublic\s+class\s+(?<name>\w+?)Controller\s+/g;

  static ServiceRe = /(\/\*{2}\n\s+\*\s+(?<desc>[^@\s]*?)\n(?:[\s\S]+?))?@(?:(?<method>Get|Post|Update|Put|Delete)?)Mapping\(\s*value\s*=\s*"(?<url>[\w\/_-{}:]+?)\".*?\)(?:[\s\S]+?)public\s+(?<res>[\w<>_[\](,\s)]+?)\s+(?<name>[\w_-]+?)\((?<params_str>[\s\S]+?)?\)\s*{/gi;

  static ParamRe = /(?<param_annotation>@.*?\s)?(?<param_type>\w+)\s+(?<param_name>\w+)(?:,\s*)?/g;

  javaCode: string;
  javaPath: string;
  controller: ControllerType;
  services: ServiceType[];

  constructor(javaCode: string, javaPath: string) {
    this.javaCode = javaCode;
    this.javaPath = javaPath;
    this._getController();
    this._getServices();
    return this;
  }

  private _getController() {
    const match = new RegExp(ServiceParser.ControllerRe).exec(this.javaCode)
    if (!match?.groups) throw new Error('invalid controller')
    this.controller = pick(match.groups, 'url', 'name');
  }

  private _getServices() {
    const services: ServiceType[] = []
    let serviceMatch: RegExpMatchArray;
    while ((
      serviceMatch = new RegExp(ServiceParser.ServiceRe).exec(this.javaCode)
    ) !== null) {
      const {params_str} = serviceMatch.groups;

      const params: ParamType[] = []
      let paramMatch: RegExpMatchArray
      const paramStr = (params_str || '').replace(/[\n\r]/g, '').replace(/\s+/g, ' ')
      while ((
        paramMatch = new RegExp(ServiceParser.ParamRe).exec(paramStr)
      ) !== null) {
        const p: ParamType = pick(paramMatch.groups,
          'param_type', 'param_name', 'param_annotation');
        params.push(p);
      }
      const s: ServiceType = {
        params,
        ...pick(serviceMatch.groups, 'desc', 'method', 'url', 'res', 'name')
      };
      services.push(s);
    }
    this.services = services
  }

  parse() {

    return {
      javaPath: this.javaPath,
      result: null
    }
  }
}

export default ServiceParser;
