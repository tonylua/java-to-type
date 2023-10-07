import {IParser} from "./parsers/Parser.d";

const fs = require("fs");
const path = require("path");
const {readJava} = require("./utils/file");
const ServiceParser = require("./parsers/ServiceParser");
const EnumParser = require("./parsers/EnumParser");
const PojoParser = require("./parsers/PojoParser");

type ParseOption = {
  isEnum?: boolean;
  isService?: boolean;
};

// TODO 匹配更多特征
// TODO 特征放在外部配置文件中
function parse(javaCode: string, javaPath: string, option?: ParseOption) {
  let parser: IParser;
  // service
  if (option?.isService || /@RestController/.test(javaCode))
    parser = ServiceParser;
  // 普通 enum
  else if (option?.isEnum || /public\s+enum\s+/.test(javaCode))
    parser = EnumParser;
  // pojo
  else if (/public\s+class\s+/.test(javaCode)) parser = PojoParser;

  if (parser) return new parser(javaCode, javaPath).parse();
  return null;
}

function parseDir(dirPath: string) {
  const files = fs.readdirSync(dirPath);
  return files.reduce((acc, file) => {
    if (path.extname(file) !== ".java") return acc;
    const javaPath = path.join(dirPath, file);
    const javaCode = readJava(javaPath);
    if (!javaCode) return acc;
    acc.push(parse(javaCode, javaPath));
    return acc;
  }, []);
}

module.exports = {
  parse,
  parseDir,
};
