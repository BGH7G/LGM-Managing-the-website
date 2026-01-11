import axios from 'axios'

// 礼貌池邮箱 - 添加后可获得更快的 API 响应速度
const POLITE_EMAIL = 'poppingg44269911@gmail.com'

// 创建专门用于 OpenAlex 的 axios 实例
const openAlexApi = axios.create({
  baseURL: 'https://api.openalex.org',
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 搜索学术文章
 * @param {Object} params - 搜索参数
 * @param {string} params.search - 搜索关键词
 * @param {number} params.page - 页码（默认 1）
 * @param {number} params.perPage - 每页数量（默认 25，最大 200）
 * @param {string} params.sortBy - 排序字段：relevance_score（相关性），cited_by_count（引用数），publication_date（发表日期）
 * @param {string} params.sortOrder - 排序方向：asc 或 desc
 * @param {number} params.fromYear - 起始年份
 * @param {number} params.toYear - 结束年份
 * @param {string} params.openAccess - 开放获取状态：true, false, 或不传
 * @param {number} params.minCitations - 最小引用数
 * @param {number} params.maxCitations - 最大引用数
 * @param {string} params.type - 文章类型：article, book-chapter, dissertation, etc.
 * @returns {Promise} - 返回搜索结果
 */
export const searchWorks = (params = {}) => {
  const {
    search = '',
    page = 1,
    perPage = 25,
    sortBy = 'relevance_score',
    sortOrder = 'desc',
    fromYear,
    toYear,
    openAccess,
    minCitations,
    maxCitations,
    type
  } = params

  // 构建查询参数
  const queryParams = new URLSearchParams()

  // 基础搜索
  if (search) {
    queryParams.append('search', search)
  }

  // 分页
  queryParams.append('page', page)
  queryParams.append('per_page', perPage)

  // 排序 - OpenAlex 使用 field:asc 或 field:desc 的格式
  queryParams.append('sort', `${sortBy}:${sortOrder}`)

  // 构建过滤条件数组
  const filters = []

  // 年份范围
  if (fromYear) {
    filters.push(`from_publication_date:${fromYear}-01-01`)
  }
  if (toYear) {
    filters.push(`to_publication_date:${toYear}-12-31`)
  }

  // 开放获取状态
  if (openAccess !== undefined && openAccess !== '') {
    filters.push(`is_oa:${openAccess}`)
  }

  // 引用数范围
  if (minCitations !== undefined && minCitations !== null) {
    filters.push(`cited_by_count:>=${minCitations}`)
  }
  if (maxCitations !== undefined && maxCitations !== null) {
    filters.push(`cited_by_count:<=${maxCitations}`)
  }

  // 文章类型
  if (type) {
    filters.push(`type:${type}`)
  }

  // 将过滤条件拼接
  if (filters.length > 0) {
    queryParams.append('filter', filters.join(','))
  }

  // 添加礼貌池邮箱以获得更快的响应速度
  queryParams.append('mailto', POLITE_EMAIL)

  return openAlexApi.get(`/works?${queryParams.toString()}`)
}

/**
 * 根据 DOI 获取文章详情
 * @param {string} doi - 文章的 DOI
 * @returns {Promise}
 */
export const getWorkByDoi = (doi) => {
  return openAlexApi.get(`/works/https://doi.org/${doi}?mailto=${POLITE_EMAIL}`)
}

/**
 * 根据 OpenAlex ID 获取文章详情
 * @param {string} id - OpenAlex ID（例如：W2741809807）
 * @returns {Promise}
 */
export const getWorkById = (id) => {
  return openAlexApi.get(`/works/${id}?mailto=${POLITE_EMAIL}`)
}

/**
 * 获取统计数据（用于数据可视化）
 * @param {Object} params - 搜索参数（与 searchWorks 相同）
 * @returns {Promise} - 返回聚合统计数据
 */
export const getWorksStatistics = async (params = {}) => {
  // 使用相同的搜索参数，但获取更多数据用于统计
  const response = await searchWorks({
    ...params,
    perPage: 200 // 获取更多数据用于统计分析
  })

  return response
}

/**
 * 根据 OpenAlex ID 获取作者详情
 * @param {string} id - 作者的 OpenAlex ID（例如：A2208157607）
 * @returns {Promise}
 */
export const getAuthorById = (id) => {
  return openAlexApi.get(`/authors/${id}?mailto=${POLITE_EMAIL}`)
}

/**
 * 根据 OpenAlex ID 获取期刊/来源详情
 * @param {string} id - 期刊的 OpenAlex ID（例如：S137773608）
 * @returns {Promise}
 */
export const getSourceById = (id) => {
  return openAlexApi.get(`/sources/${id}?mailto=${POLITE_EMAIL}`)
}

/**
 * 根据 OpenAlex ID 获取机构详情
 * @param {string} id - 机构的 OpenAlex ID（例如：I114027177）
 * @returns {Promise}
 */
export const getInstitutionById = (id) => {
  return openAlexApi.get(`/institutions/${id}?mailto=${POLITE_EMAIL}`)
}

/**
 * 根据 OpenAlex ID 获取出版商详情
 * @param {string} id - 出版商的 OpenAlex ID（例如：P4310320990）
 * @returns {Promise}
 */
export const getPublisherById = (id) => {
  return openAlexApi.get(`/publishers/${id}?mailto=${POLITE_EMAIL}`)
}

/**
 * 搜索作者
 * @param {Object} params - 搜索参数
 * @param {string} params.search - 搜索关键词
 * @param {number} params.page - 页码（默认 1）
 * @param {number} params.perPage - 每页数量（默认 25，最大 200）
 * @param {string} params.sortBy - 排序字段：relevance_score（相关性），works_count（文章数），cited_by_count（引用数）
 * @param {string} params.sortOrder - 排序方向：asc 或 desc
 * @param {number} params.minWorksCount - 最小文章数
 * @param {number} params.maxWorksCount - 最大文章数
 * @param {number} params.minCitations - 最小引用数
 * @param {number} params.maxCitations - 最大引用数
 * @returns {Promise} - 返回搜索结果
 */
export const searchAuthors = (params = {}) => {
  const {
    search = '',
    page = 1,
    perPage = 25,
    sortBy = 'relevance_score',
    sortOrder = 'desc',
    minWorksCount,
    maxWorksCount,
    minCitations,
    maxCitations
  } = params

  // 构建查询参数
  const queryParams = new URLSearchParams()

  // 基础搜索
  if (search) {
    queryParams.append('search', search)
  }

  // 分页
  queryParams.append('page', page)
  queryParams.append('per_page', perPage)

  // 排序
  queryParams.append('sort', `${sortBy}:${sortOrder}`)

  // 构建过滤条件数组
  const filters = []

  // 文章数范围
  if (minWorksCount !== undefined && minWorksCount !== null) {
    filters.push(`works_count:>=${minWorksCount}`)
  }
  if (maxWorksCount !== undefined && maxWorksCount !== null) {
    filters.push(`works_count:<=${maxWorksCount}`)
  }

  // 引用数范围
  if (minCitations !== undefined && minCitations !== null) {
    filters.push(`cited_by_count:>=${minCitations}`)
  }
  if (maxCitations !== undefined && maxCitations !== null) {
    filters.push(`cited_by_count:<=${maxCitations}`)
  }

  // 将过滤条件拼接
  if (filters.length > 0) {
    queryParams.append('filter', filters.join(','))
  }

  // 添加礼貌池邮箱
  queryParams.append('mailto', POLITE_EMAIL)

  return openAlexApi.get(`/authors?${queryParams.toString()}`)
}

/**
 * 根据作者 ID 查询该作者的文章
 * @param {string} authorId - 作者的 OpenAlex ID（例如：A2208157607）
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码（默认 1）
 * @param {number} options.perPage - 每页数量（默认 25）
 * @param {string} options.sortBy - 排序字段（默认 publication_date）
 * @param {string} options.sortOrder - 排序方向（默认 desc）
 * @returns {Promise} - 返回作者的文章列表
 */
export const getWorksByAuthor = (authorId, options = {}) => {
  const {
    page = 1,
    perPage = 25,
    sortBy = 'publication_date',
    sortOrder = 'desc'
  } = options

  const queryParams = new URLSearchParams()

  // 使用 filter 参数按作者 ID 筛选
  queryParams.append('filter', `author.id:${authorId}`)

  // 分页
  queryParams.append('page', page)
  queryParams.append('per_page', perPage)

  // 排序
  queryParams.append('sort', `${sortBy}:${sortOrder}`)

  // 添加礼貌池邮箱
  queryParams.append('mailto', POLITE_EMAIL)

  return openAlexApi.get(`/works?${queryParams.toString()}`)
}
