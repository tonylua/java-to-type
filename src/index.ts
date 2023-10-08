import type {ParseOption, ParseResult, ParserContructor} from "./types/Parser";
import ServiceParser from "./parsers/ServiceParser";
import EnumParser from "./parsers/EnumParser";
import PojoParser from "./parsers/PojoParser";

const fs = require("fs");
const path = require("path");
const {readJava} = require("./utils/file");

// TODO 匹配更多特征
// TODO 特征放在外部配置文件中
function parseJava(javaCode: string, javaPath: string, option?: ParseOption) {
  let parser: ParserContructor;
  // service
  if (option?.isService || /@RestController/.test(javaCode))
    parser = ServiceParser;
  // 普通 enum
  else if (option?.isEnum || /public\s+enum\s+/.test(javaCode))
    parser = EnumParser;
  // pojo
  else if (/public\s+class\s+/.test(javaCode)) parser = PojoParser;

  if (parser) return new parser(javaCode, javaPath).parse('jsdoc');
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
