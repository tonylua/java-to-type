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