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
 * @return {Promise<BasicInfo>}
 */
export function cccQueryById () {
  return request({
    url: `/api/ccc/queryById/{id}`,
    method: 'get',
  })
}
/** 查询我的 cccMyList
 * @url /ccc/myList
 * @method GET
 * @return {Promise<PageInfo<BasicInfo>>}
 */
export function cccMyList () {
  return request({
    url: `/api/ccc/myList`,
    method: 'get',
  })
}
/**  cccFoofoo
 * @url /ccc/foofoo
 * @method GET
 * @return {Promise<String>}
 */
export function cccFoofoo () {
  return request({
    url: `/api/ccc/foofoo`,
    method: 'get',
  })
}
/** 注册 cccRegister
 * @url /ccc/register/{id}
 * @method POST
 * @return {Promise<Map<String, Object>>}
 */
export function cccRegister () {
  return request({
    url: `/api/ccc/register/{id}`,
    method: 'post',
  })
}
/**  cccInsert
 * @url /ccc/insert
 * @method POST
 * @return {Promise<Integer>}
 */
export function cccInsert () {
  return request({
    url: `/api/ccc/insert`,
    method: 'post',
  })
}