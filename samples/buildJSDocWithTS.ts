import type { ParseResult, ParseOption } from '../src/types/Parser.d.ts'

const fs = require('fs')
const path = require('path')
const { rimrafSync } = require('rimraf')
const config = require('./config')
const { parseDir } = require('../dist/j2type.js')

const javaProjPath = path.resolve(__dirname, config.javaDir)
const saveToBase = path.resolve(__dirname, config.dist2)

if (!fs.existsSync(javaProjPath)) {
  console.error('java目录不存在')
  process.exit(1)
}

function j2doc(
  javaDir: string,
  saveTo: string,
  option?: ParseOption & {
    nameTransformer?: (name: string) => string
    prepandContent?: string
  },
) {
  const { parserMeta, ...restOption } = option || {}
  const parseResult: ParseResult[] = parseDir(javaDir, {
    parserMeta: {
      apiPrefix: config.apiPrefix,
      outputTS: true,
      ...parserMeta,
    },
    ...restOption,
  })
  const relDirPath = path.relative(__dirname, javaDir)
  const isSaveToDir = !/\.(t|j)s$/.test(saveTo)
  const prepand = option?.prepandContent ? `\n${option.prepandContent}` : ''
  let cont = `// 内容自动生成，来自${relDirPath}${prepand}\n\n`
  if (isSaveToDir) {
    if (!fs.existsSync(saveTo)) fs.mkdirSync(saveTo)
    parseResult.forEach(r => {
      const m = /\/(?<fileName>\w+)\.java$/.exec(r.javaPath)
      const { fileName } = m.groups
      const n =
        typeof option?.nameTransformer === 'function'
          ? option.nameTransformer(fileName)
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

const enumDir = path.resolve(javaProjPath, 'enum')
const pojoDir = path.resolve(javaProjPath, 'pojo')
const srvDir = path.resolve(javaProjPath, 'service')
const enumDts = path.resolve(saveToBase, 'enum.d.ts')
const pojoDts = path.resolve(saveToBase, 'pojo.d.ts')
const srvDist = path.resolve(saveToBase, 'service')
j2doc(enumDir, enumDts, {
  isEnum: true,
})
j2doc(pojoDir, pojoDts)
j2doc(srvDir, srvDist, {
  isService: true,
  parserMeta: {
    serviceMeta: {
      [pojoDir]: path.relative(srvDist, pojoDts),
      [enumDir]: path.relative(srvDist, enumDts),
    },
  },
  nameTransformer: name => name.replace('My', 'Our') + '.js',
  prepandContent: `
/**
 * @typedef {Object} PageInfo
 * @property {Array.<T>} list
 * @property {Number} total - 总记录数
 * @property {Number} pageNum - 当前页
 * @property {Number} pageSize - 每页的数量
 * @template T
 */
`,
})
