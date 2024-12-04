// 内容自动生成，来自java\enum

/**
 * @readonly
 * @enum {String}
 */
export const Color = {
  RED: '#FF0000',
}

/**
 * @readonly
 * @enum {Number}
 */
export const Day = {
  MONDAY: 0,
}

/**
 * @readonly
 * @enum {Number}
 */
export const Geometry = {
  CIRCLE: 3.14159265359,
  SQUARE: 1.0,
  TRIANGLE: 0.5,
}

/**
 * @readonly
 * @enum {Number}
 */
export const ITSoftStatus = {
  Draft: 0, // 草稿", 0, 1
  Analysis: 1, // 需求分析中", 0,2
  Solution: 2, // 制定解决方案中", 1,3
  DEV: 3, // 开发中", 2, 4
  SIT: 4, // SIT测试中", 3,5
  UAT: 5, // UAT测试中", 4,6
  UAT_PASS: 6, // UAT通过", 5,7
  Wait_Publish: 7, // 待发布", 6,99
  Completed: 99, // 已完成", 0,7
  Close: 11, // 已结案", 0,0
}

/**
 * @readonly
 * @enum {Number}
 */
export const ITSoftAction = {
  Submit: 0, // 提交
  Reject: 1, // 驳回
  Close: 2, // 结案
  Transfer: 3, // 转办
  Publish: 4, // 发布上线
  OTHER: -1, // 其他
}

/**
 * @readonly
 * @enum {Number}
 */
export const LogType = {
  SYSTEM: 0, // 系统
  USER: 1, // 用户
}

/**
 * @readonly
 * @enum {String}
 */
export const MyEnum = {
  VALUEA: '1', // 规划中
  VALUE_B: '2', // 333
  VALUEC: '3', // sss
}

/**
 * @readonly
 * @enum {String}
 */
export const StaticMems = {
  ABC_ABC: 'abc_abc',
  DEF_DEF: 'def_def',
}