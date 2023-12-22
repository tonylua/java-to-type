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
function parseJava(javaCode: string, javaPath: string, option?: ParseOption) {
  let Parser: ParserContructor | null = null
  // service
  if (ServiceParser.match(javaCode)) Parser = ServiceParser
  // enum
  else if (option?.isEnum)
    Parser = EnumParser.match(javaCode)
      ? EnumParser
      : ConstantParser.match(javaCode)
      ? ConstantParser
      : null
  // pojo
  else if (PojoParser.match(javaCode)) Parser = PojoParser
  if (!Parser) return null

  return new Parser(javaCode, javaPath, option?.parserMeta).parse('jsdoc')
}

function parseDir(dirPath: string, option?: ParseOption) {
  const files = fs.readdirSync(dirPath)
  return files
    .reduce((acc: ParseResult[], file: File) => {
      if (path.extname(file) !== '.java') return acc
      const javaPath = path.join(dirPath, file)
      const javaCode = readJava(javaPath)
      if (!javaCode) return acc
      acc.push(parseJava(javaCode, javaPath, option))
      return acc
    }, [])
    .filter(Boolean)
}

module.exports = {
  parseJava,
  parseDir,
}
