/**
 * 分页查询结果
 */
export interface Page<T> {
  /**
   * 是否还有下一页
   */
  has_more: boolean
  items: T[]
  /**
   * 当前页码，从 1 开始
   */
  page: number
  page_size: number
  /**
   * 符合条件的总条数
   */
  total: number
}
