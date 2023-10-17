import type {ParseOption, ParseResult, ParserContructor} from "./types/Parser";
import ServiceParser from "./parsers/ServiceParser";
import EnumParser from "./parsers/EnumParser";
import PojoParser from "./parsers/PojoParser";
import {readJava} from "./utils/file";
const fs = require("fs");
const path = require("path");

// TODO 匹配更多特征
// TODO 特征放在外部配置文件中
function parseJava(javaCode: string, javaPath: string, option?: ParseOption) {
  let Parser: ParserContructor | null = null;
  // service
  if (option?.isService || /@RestController/.test(javaCode))
    Parser = ServiceParser;
  // enum
  else if (option?.isEnum || /public\s+enum\s+/.test(javaCode))
    Parser = EnumParser;
  // pojo
  else if (/public\s+class\s+/.test(javaCode)) Parser = PojoParser;

  if (Parser)
    return new Parser(
      javaCode,
      javaPath,
      option?.parserMeta
    ).parse('jsdoc');

  return null;
}

function parseDir(dirPath: string, option?: ParseOption) {
  const files = fs.readdirSync(dirPath);
  return files.reduce((acc: ParseResult[], file: File) => {
    if (path.extname(file) !== ".java") return acc;
    const javaPath = path.join(dirPath, file);
    const javaCode = readJava(javaPath);
    if (!javaCode) return acc;
    acc.push(parseJava(javaCode, javaPath, option));
    return acc;
  }, []);
}

module.exports = {
  parseJava,
  parseDir,
};
