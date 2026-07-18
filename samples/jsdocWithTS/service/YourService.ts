// 内容自动生成，来自java\service

import request from '@/utils/request'

/** 查询所有 */
export function cccFindAll(): Promise<SomeCategory[]> {
  return request({
    url: `/ccc/findAll`,
    method: 'get',
  })
}