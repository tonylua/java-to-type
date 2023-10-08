// 内容自动生成，来自java/service

import request from '@/utils/request'

/** cccQueryById
 * @url /ccc/queryById/{id}
 * @method GET
 * @param {Integer}  [id]
 * @return {Promise<BasicInfo>}
 */
export function cccQueryById (id) {
  return request({
    url: `/ccc/queryById/${id}`,
    method: 'get',
    params: {
    }
  })
}
/** cccMyList
 * @url /ccc/myList
 * @method GET
 * @param {String}  [headers.code]
 * @param {MyInfo}  [info]
 * @return {Promise<PageInfo<BasicInfo>>}
 */
export function cccMyList (info) {
  return request({
    url: `/ccc/myList`,
    method: 'get',
    params: {
      info
    }
  })
}
/** cccRegister
 * @url /ccc/register/{id}
 * @method POST
 * @param {MyInfo}  [info]
 * @return {Promise<PageInfo<BasicInfo>>}
 */
export function cccRegister (info) {
  return request({
    url: `/ccc/register/{id}`,
    method: 'post',
    body: {
      info
    }
  })
}