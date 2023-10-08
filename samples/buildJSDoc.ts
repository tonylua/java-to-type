import type {ParseResult, ParseOption} from '../src/types/Parser.d.ts'

const fs = require('fs')
const path = require('path')
const {rimrafSync} = require('rimraf')
const {parseDir} = require('../src/index.ts')

const javaProjPath = path.resolve(__dirname, './java')
const saveToBase = path.resolve(__dirname, './jsdoc')

if (!fs.existsSync(javaProjPath)) {
  console.error('java目录不存在');
  process.exit(1)
}

function j2doc(
  javaDir: string,
  saveTo: string,
  option?: ParseOption,
  nameTransformer?: (name: string) => string) {
  const parseResult: ParseResult[] = parseDir(javaDir, option);
  const relDirPath = path.relative(__dirname, javaDir);
  const isSaveToDir = !/\.js$/.test(saveTo);
  let cont = `// 内容自动生成，来自${relDirPath}\n\n`
  if (isSaveToDir) {
    if (!fs.existsSync(saveTo)) fs.mkdirSync(saveTo);
    parseResult.forEach(r => {
      const m = /\/(?<fileName>\w+)\.java$/.exec(r.javaPath)
      const {fileName} = m.groups
      const n = typeof nameTransformer === 'function'
        ? nameTransformer(fileName)
        : `${fileName}.js`
      const p = path.resolve(saveTo, n)
      fs.writeFileSync(p, `${cont}${r.result}\r`, 'utf8')
    })
  } else {
    cont += parseResult.map(r => r.result).join('\n\n')
    cont += '\r'
    fs.writeFileSync(saveTo, cont, 'utf8')
  }
  console.log(`已生成 ${relDirPath}`)
}

if (fs.existsSync(saveToBase)) rimrafSync(saveToBase)
fs.mkdirSync(saveToBase)

j2doc(
  path.resolve(javaProjPath, 'service'),
  path.resolve(saveToBase, 'service'),
  {isService: true},
  name => name.replace('My', 'Your') + '.js'
)
j2doc(
  path.resolve(javaProjPath, 'enum'),
  path.resolve(saveToBase, 'enum'),
  {isEnum: true}
)
j2doc(
  path.resolve(javaProjPath, 'pojo'),
  path.resolve(saveToBase, 'pojo'),
)
