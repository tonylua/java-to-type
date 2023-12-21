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
 * @param { return}  [xxx]
 * @param {PPPP)}  [public]
 * @param { BasicInfo}  [findById]
 * @param {Integer}  [id]
 * @param { return}  [xxx]
 * @param {PPPP)}  [public]
 * @param { PageInfo<BasicInfo>}  [myList]
 * @param {String}  [headers.code]
 * @param {MyInfo}  [info]
 * @param { return}  [xxx]
 * @param {public}  [String]
 * @param {String}  [headers.code]
 * @param {String}  [type]
 * @param {Integet[]}  [ids]
 * @param {MyInfo}  [info]
 * @param { return}  [xxx]
 * @param {PPPP)}  [public]
 * @param { Map<String,}  [Object]
 * @param {>}  [register]
 * @param {MyInfo}  [info]
 * @param { return}  [xxx]
 * @param {public}  [Integer]
 * @param {SomeCategory}  [someCategory]
 * @param {import('../enum').Color}  [color]
 * @return {Promise<SomeCategory[]>}
 */
export function cccFindAll (xxx, public, findById, id, xxx, public, myList, info, xxx, String, type, ids, info, xxx, public, Object, register, info, xxx, Integer, someCategory, color) {
  return request({
    url: `/api/ccc/findAll`,
    method: 'get',
    params: {
      xxx,
      public,
      findById,
      xxx,
      public,
      myList,
      info,
      xxx,
      String,
      type,
      ids,
      info,
      xxx,
      public,
      Object,
      register,
      info,
      xxx,
      Integer,
      someCategory,
      color
    }
  })
}