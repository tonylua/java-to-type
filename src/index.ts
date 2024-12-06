import type { ParseOption, ParseResult, ParserContructor } from './types/Parser'
import ServiceParser from './parsers/ServiceParser'
import EnumParser from './parsers/EnumParser'
import PojoParser from './parsers/PojoParser'
import ConstantParser from './parsers/ConstantParser'
import { readJava } from './utils/file'
const fs = require('fs')
const path = require('path')

global.dtsCache = {}

// TODO 匹配更多特征
// TODO 特征放在外部配置文件中?
function parseJava(
  javaCode: string,
  javaPath: string,
  option?: ParseOption,
): ParseResult[] | null {
  let Parsers: Array<ParserContructor | null> = []
  let code: string = javaCode
  const results: ParseResult[] = []

  // service
  if (ServiceParser.match(code)) {
    Parsers.push(ServiceParser)
  }
  // enum
  else if (option?.isEnum) {
    Parsers.push(
      EnumParser.match(code)
        ? EnumParser
        : ConstantParser.match(code)
        ? ConstantParser
        : null,
    )
  }
  // pojo
  else if (PojoParser.match(code)) {
    // @ts-ignore
    const nestedStaticMatches = PojoParser?.matchNestedStaticClasses?.(code)
    if (nestedStaticMatches?.length) {
      for (let i = nestedStaticMatches.length - 1; i > -1; i--) {
        const { startLine, endLine, className } = nestedStaticMatches[i]
        // @ts-ignore
        const nestedCode = PojoParser?.extractSubclass?.(
          code,
          startLine,
          endLine,
        )?.replace(/static\s+class/, 'class')
        const nestedClassPath =
          javaPath.replace(/\.java$/, '') + `${className}.java`
        results.push(
          new PojoParser(
            nestedCode,
            nestedClassPath,
            option?.parserMeta,
          ).parse(),
        )
        // @ts-ignore
        code = PojoParser?.deleteSubclass?.(code, startLine, endLine)
      }
    }
    Parsers.push(PojoParser)
  }

  Parsers = Parsers.filter(Boolean)
  if (!Parsers.length) return null

  return [
    ...results,
    ...Parsers.map(P => new P(code, javaPath, option?.parserMeta).parse()),
  ]
}

function parseDir(dirPath: string, option?: ParseOption) {
  const files = fs.readdirSync(dirPath)
  return files
    .reduce((acc: ParseResult[], file: File) => {
      if (path.extname(file) !== '.java') return acc
      const javaPath: string = path.join(dirPath, file)
      const javaCode = readJava(javaPath)
      if (Array.isArray(option.excludePaths) 
        && option.excludePaths.some(str => javaPath.includes(str))) return acc;
      if (!javaCode) return acc
      const results = parseJava(javaCode, javaPath, option)
      return results ? [...acc, ...results] : acc
    }, [])
    .filter(Boolean)
}

module.exports = {
  parseJava,
  parseDir,
}
