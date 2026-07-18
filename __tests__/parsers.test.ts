import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const { parseDir, parseJava } = require('../dist/j2type.js')

describe('AST Parser Snapshot Tests', () => {
  const samplesDir = path.resolve(__dirname, '../samples/java')

  describe('POJO Parser', () => {
    const pojoDir = path.join(samplesDir, 'pojo')
    const files = fs.readdirSync(pojoDir).filter(f => f.endsWith('.java'))

    it.each(files)('parses %s correctly', (file) => {
      const result = parseDir(path.join(pojoDir, file).replace(/\\[^\\]*$/, ''), {})
      const target = result.find(r => r.javaPath.includes(file))
      expect(target?.result).toMatchSnapshot(file)
    })
  })

  describe('Enum Parser', () => {
    const enumDir = path.join(samplesDir, 'enum')
    const files = fs.readdirSync(enumDir).filter(f => f.endsWith('.java'))

    it.each(files)('parses %s correctly', (file) => {
      const result = parseDir(path.join(enumDir, file).replace(/\\[^\\]*$/, ''), { isEnum: true })
      const target = result.find(r => r.javaPath.includes(file))
      expect(target?.result).toMatchSnapshot(file)
    })
  })

  describe('Service Parser', () => {
    const serviceDir = path.join(samplesDir, 'service')
    const files = fs.readdirSync(serviceDir).filter(f => f.endsWith('.java'))

    it.each(files)('parses %s correctly', (file) => {
      const result = parseDir(path.join(serviceDir, file).replace(/\\[^\\]*$/, ''), { isService: true })
      const target = result.find(r => r.javaPath.includes(file))
      expect(target?.result).toMatchSnapshot(file)
    })
  })

  describe('TypeScript Output', () => {
    const enumDir = path.join(samplesDir, 'enum')
    const files = fs.readdirSync(enumDir).filter(f => f.endsWith('.java') && !f.includes('Interface'))

    it.each(files)('parses %s to TS correctly', (file) => {
      const result = parseDir(path.join(enumDir, file).replace(/\\[^\\]*$/, ''), {
        isEnum: true,
        parserMeta: { outputTS: true }
      })
      const target = result.find(r => r.javaPath.includes(file))
      expect(target?.result).toMatchSnapshot(`ts-${file}`)
    })
  })

  describe('Service Parser (TypeScript)', () => {
    const serviceDir = path.join(samplesDir, 'service')
    const files = fs.readdirSync(serviceDir).filter(f => f.endsWith('.java'))

    it.each(files)('parses %s to TS correctly', (file) => {
      const result = parseDir(path.join(serviceDir, file).replace(/\\[^\\]*$/, ''), {
        isService: true,
        parserMeta: { outputTS: true },
      })
      const target = result.find(r => r.javaPath.includes(file))
      expect(target?.result).toMatchSnapshot(`ts-${file}`)
    })
  })

  // 真实开源项目样本（macrozheng/mall, yangzongzhuan/RuoYi, eugenp/tutorials）
  describe('External Real-World Samples', () => {
    const externalDir = path.join(samplesDir, 'external')

    // [文件, option]
    const cases: [string, any][] = [
      ['PmsProduct.java', {}],                          // 复杂 POJO + @Schema
      ['PmsSkuStock.java', {}],                          // MBG 生成 POJO
      ['SysUser.java', {}],                              // 继承 + 校验注解在 getter
      ['ConfirmOrderResult.java', {}],                   // 嵌套静态类 + 泛型 List
      ['StudentRecord.java', {}],                        // Java record
      ['ColorData.java', {}],                            // Lombok @Data
      ['ResultCode.java', { isEnum: true }],             // 双参数枚举构造器
      ['UserStatus.java', { isEnum: true }],             // 双参数枚举 (code, info)
      ['PmsProductController.java', { isService: true }], // @RequestMapping(method=...)
    ]

    it.each(cases)('parses %s correctly', (file, option) => {
      const code = fs.readFileSync(path.join(externalDir, file), 'utf8')
      const result = parseJava(code, file, option)
      const merged = result ? result.map((r: any) => r.result).join('\n\n') : null
      expect(merged).toMatchSnapshot(file)
    })
  })
})
