// java-parser is CommonJS, use require
const { parse, BaseJavaCstVisitorWithDefaults } = require('java-parser')

export interface CommentInfo {
  text: string
  startLine: number
  endLine: number
}

export function parseJavaToCST(javaCode: string) {
  return parse(javaCode)
}

export function extractComments(cst: any): CommentInfo[] {
  const comments = cst.comments || []
  return comments.map((c: any) => ({
    text: c.image,
    startLine: c.startLine,
    endLine: c.endLine,
  }))
}

export function findDocComment(
  comments: CommentInfo[],
  targetLine: number,
  maxDistance = 2,
): string | undefined {
  const candidates = comments.filter(
    c => c.endLine < targetLine &&
         c.text.startsWith('/**') &&
         targetLine - c.endLine <= maxDistance,
  )
  if (!candidates.length) return undefined
  const nearest = candidates.reduce((closest, curr) =>
    curr.endLine > closest.endLine ? curr : closest,
  )
  return nearest.text
}

export function extractCommentDescription(docComment: string): string {
  return docComment
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map(line =>
      line
        .replace(/^\s*\*\s?/, '')
        .replace(/^\s*\*?$/, '')
        .trim(),
    )
    .filter(line => line && !line.startsWith('@'))
    .join(' ')
    .trim()
}

export function hasAnnotation(
  modifiers: any[],
  annotationName: string,
): boolean {
  if (!Array.isArray(modifiers)) return false
  return modifiers.some((mod: any) => {
    const ann = mod.children?.annotation?.[0]
    if (!ann) return false
    const name =
      ann.children?.typeName?.[0]?.children?.Identifier?.[0]?.image
    return name === annotationName
  })
}

// 从 unannType 节点提取类型名，保留泛型参数，如 List<CartPromotionItem>
export function getTypeImage(unannType: any): string {
  if (!unannType) return 'Object'

  // 基本类型 int/long/boolean 等
  const prim = unannType.children?.unannPrimitiveTypeWithOptionalDimsSuffix?.[0]
    ?.children?.unannPrimitiveType?.[0]
  if (prim) {
    const numeric = prim.children?.numericType?.[0]
    const numImg = numeric && JSON.stringify(numeric).match(/"image":"(\w+)"/)
    if (numImg) return numImg[1]
    if (prim.children?.Boolean?.[0]?.image) return 'boolean'
  }

  // 引用类型：unannClassType 下有 Identifier + 可选 typeArguments
  const classType = unannType.children?.unannReferenceType?.[0]
    ?.children?.unannClassOrInterfaceType?.[0]
    ?.children?.unannClassType?.[0]
  if (classType?.children?.Identifier?.[0]?.image) {
    const base = classType.children.Identifier[0].image
    // 泛型参数
    const typeArgs = classType.children?.typeArguments?.[0]
    if (typeArgs) {
      const args = typeArgs.children?.typeArgumentList?.[0]?.children?.typeArgument || []
      const inners = args
        .map((a: any) => {
          const ct = a.children?.referenceType?.[0]
            ?.children?.classOrInterfaceType?.[0]
            ?.children?.classType?.[0]
          return ct?.children?.Identifier?.[0]?.image
        })
        .filter(Boolean)
      if (inners.length) return `${base}<${inners.join(', ')}>`
    }
    return base
  }

  // fallback: 抓第一个 image
  const str = JSON.stringify(unannType)
  const match = str.match(/"image":"(\w+)"/)
  return match ? match[1] : 'Object'
}

export { BaseJavaCstVisitorWithDefaults }
