import type { ParseOption, ParseResult, ParserContructor } from './types/Parser'
import ServiceParser from './parsers/ast/ServiceParser'
import EnumParser from './parsers/ast/EnumParser'
import PojoParser from './parsers/ast/PojoParser'
import ConstantParser from './parsers/ast/ConstantParser'
import { readJava } from './utils/file'
const fs = require('fs')
const path = require('path')

global.dtsCache = {}

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
    .reduce((acc: ParseResult[], file: string) => {
      if (path.extname(file) !== '.java') return acc
      const javaPath: string = path.join(dirPath, file)
      const javaCode = readJava(javaPath)
      if (Array.isArray(option?.excludePaths)
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
