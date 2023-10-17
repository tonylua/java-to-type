// 内容自动生成，来自java/service

import request from '@/utils/request'

/** cccGet
 * @url /ccc/Get
 * @method 通过竹简查询
 * @return {Promise</queryById/{id}>}
 */
export function cccGet () {
  return request({
    url: `/api/ccc/Get`,
    method: '通过竹简查询',
  })
}
/** cccGet
 * @url /ccc/Get
 * @method 查询我的
 * @return {Promise</myList>}
 */
export function cccGet () {
  return request({
    url: `/api/ccc/Get`,
    method: '查询我的',
  })
}
/** cccPost
 * @url /ccc/Post
 * @method 注册
 * @return {Promise</register/{id}>}
 */
export function cccPost () {
  return request({
    url: `/api/ccc/Post`,
    method: '注册',
  })
}