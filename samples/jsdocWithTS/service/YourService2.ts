// 内容自动生成，来自java\service

import request from '@/utils/request'

/** 查询所有 */
export function cccFindAll(): Promise<SomeCategory[]> {
  return request({
    url: `/ccc/findAll`,
    method: 'get',
  })
}

/** 通过竹简查询 */
export function cccQueryById(id?: number): Promise<BasicInfo> {
  return request({
    url: `/ccc/queryById/{id}`,
    method: 'get',
  })
}

/** 查询我的 */
export function cccMyList(info?: MyInfo): Promise<PageInfo<BasicInfo>> {
  return request({
    url: `/ccc/myList`,
    method: 'get',
  })
}

/** download */
export function cccFoofoo(type?: string, ids?: Integet[], info?: MyInfo): Promise<string> {
  return request({
    url: `/ccc/foofoo`,
    method: 'get',
  })
}

/** 注册 */
export function cccRegister(info?: MyInfo): Promise<Map<string>> {
  return request({
    url: `/ccc/register/{id}`,
    method: 'post',
  })
}

/** foo.bar,. */
export function cccInsert(someCategory?: SomeCategory, color?: Color): Promise<number> {
  return request({
    url: `/ccc/insert`,
    method: 'post',
  })
}