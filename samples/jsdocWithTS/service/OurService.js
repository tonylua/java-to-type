// 内容自动生成，来自java/service

/**
 * @typedef {Object} PageInfo
 * @property {Array.<T>} list
 * @property {Number} total - 总记录数
 * @property {Number} pageNum - 当前页
 * @property {Number} pageSize - 每页的数量
 * @template T
 */


import request from '@/utils/request'

/** 查询所有 cccFindAll
 * @url /ccc/findAll
 * @method GET
 * @return {Promise<SomeCategory[]>}
 */
export function cccFindAll () {
  return request({
    url: `/api/ccc/findAll`,
    method: 'get',
  })
}
/** 通过竹简查询 cccQueryById
 * @url /ccc/queryById/{id}
 * @method GET
 * @param {Integer}  [id]
 * @return {Promise<BasicInfo>}
 */
export function cccQueryById (id) {
  return request({
    url: `/api/ccc/queryById/${id}`,
    method: 'get',
  })
}
/** 查询我的 cccMyList
 * @url /ccc/myList
 * @method GET
 * @param {String}  [headers.code]
 * @param {MyInfo}  [info]
 * @return {Promise<PageInfo<BasicInfo>>}
 */
export function cccMyList (info) {
  return request({
    url: `/api/ccc/myList`,
    method: 'get',
    params: {
      info
    }
  })
}
/**  cccFoofoo
 * @url /ccc/foofoo
 * @method GET
 * @param {String}  [headers.code]
 * @param {String}  [type]
 * @param {Integet[]}  [ids]
 * @param {MyInfo}  [info]
 * @return {Promise<String>}
 */
export function cccFoofoo (type, ids, info) {
  return request({
    url: `/api/ccc/foofoo`,
    method: 'get',
    params: {
      type,
      ids,
      info
    }
  })
}
/** 注册 cccRegister
 * @url /ccc/register/{id}
 * @method POST
 * @param {MyInfo}  [info]
 * @return {Promise<Map<String, Object>>}
 */
export function cccRegister (info) {
  return request({
    url: `/api/ccc/register/{id}`,
    method: 'post',
    body: {
      info
    }
  })
}
/**  cccInsert
 * @url /ccc/insert
 * @method POST
 * @param {SomeCategory}  [someCategory]
 * @param {import('../enum').Color}  [color]
 * @return {Promise<Integer>}
 */
export function cccInsert (someCategory, color) {
  return request({
    url: `/api/ccc/insert`,
    method: 'post',
    body: {
      someCategory,
      color
    }
  })
}