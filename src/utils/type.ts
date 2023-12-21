import type { ParserMeta } from '../types/Parser'
const path = require('path')

const TypeMap = {
  'boolean': 'Boolean',
  'Date': 'String',
  'char': 'String',
  'char[]': 'String',
  'String': 'String',
  'byte': 'String',
  'short': 'Number',
  'int': 'Number',
  'Integer': 'Number',
  'long': 'Number',
  'float': 'Number',
  'double': 'Number',
}

// https://github.com/microsoft/TypeScript/issues/36132#issuecomment-573141594
export const getJSType = function getJSType(
  javaType: string,
  isTypescript = false,
) {
  // const arrRe: RegExp = /(?:\w*)List<(?<itemType>\w+)>/g;
  const arrRe: RegExp = /(?:\w*)List<(\w+)>/g
  if (arrRe.test(javaType)) {
    const m = new RegExp(arrRe).exec(javaType)
    // return `${getJSType(m.groups.itemType)}[]`;
    return `${getJSType(m[1], isTypescript)}[]`
  }
  const mapped = TypeMap[javaType.toLowerCase()]
  if (mapped) return isTypescript ? mapped.toLowerCase() : mapped
  return javaType
}

export function getOrImportType(javaType: string, parserMeta: ParserMeta) {
  const serviceMeta = parserMeta?.serviceMeta
  let t = getJSType(javaType, parserMeta?.outputTS)

  const arrMatch = /^(.*?)(\[\])+$/.exec(t)
  if (arrMatch) return getOrImportType(arrMatch[1], serviceMeta) + arrMatch[2]

  const genericMatch = /^(.*?)<(.*?)>$/.exec(t)
  if (genericMatch) {
    const types = genericMatch[2]
      .split(/\s*\,\s*/)
      .map(t => getOrImportType(t, serviceMeta))
      .join(', ')
    return `${genericMatch[1]}<${types}>`
  }

  if (t in global.dtsCache) {
    const javaDir = path.dirname(global.dtsCache[t])
    const metaKey = Object.keys(serviceMeta).find(k => k === javaDir)
    if (metaKey) {
      const dtsPath = serviceMeta[metaKey].replace(/\.d\.ts$/, '')
      t = `import('${dtsPath}').${t}`
    }
  }

  return t
}
