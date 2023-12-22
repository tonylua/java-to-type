// https://www.typescriptlang.org/docs/handbook/interfaces.html#difference-between-the-static-and-instance-sides-of-classes

export type ParserMeta = {
  jsDocServiceRequestInstanceName?: string
  jsDocServiceTopImport?: string
  apiPrefix?: string
  outputTS?: boolean
  serviceMeta?: Record<string, string>
}

export interface ParserContructor {
  new (javaCode: string, javaPath: string, meta?: ParserMeta): IParser
  match: (code: string) => boolean
}

export type ParseOption = {
  isEnum?: boolean
  isService?: boolean
  parserMeta?: ParserMeta
}

export type ParseType = 'jsdoc' | 'ts'

export interface IParser {
  parse?: (type: ParseType) => { result: string; javaPath: string }
}

export type ParseResult = ReturnType<IParser['parse']>

export type ControllerType = {
  url: string
  name: string
}

export type ServiceParamType = {
  param_annotation?: string
  param_type: string
  param_name: string
}

export type ServiceType = {
  desc?: string
  method: string
  url: string
  res: string
  name: string
  params: ServiceParamType[]
}

export type PojoProperty = {
  type: string
  name: string
  desc?: string
  isOptional?: boolean
}

export type EnumProperty = {
  type?: string
  key: string
  value: string
  desc?: string
}
