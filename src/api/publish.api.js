import { authApi } from '@/utils/axios'

const base = '/publication'

// -------------------- Publications --------------------
// 获取出版物列表（分页/排序）
export const getPublications = (params = {}) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'year',
    sortOrder = 'DESC'
  } = params

  const queryParams = new URLSearchParams()
  queryParams.append('page', page)
  queryParams.append('pageSize', pageSize)
  queryParams.append('sortBy', sortBy)
  queryParams.append('sortOrder', sortOrder)

  return authApi.get(`${base}?${queryParams.toString()}`)
}

// 获取单个出版物详情
export const getPublicationById = (id) => authApi.get(`${base}/${id}`)

// 创建出版物（管理员）
export const createPublication = (data) => authApi.post(base, data)

// 更新出版物
export const updatePublication = (id, data) => authApi.put(`${base}/${id}`, data)

// 删除出版物
export const deletePublication = (id) => authApi.delete(`${base}/${id}`)

// -------------------- Sub Resources --------------------

// Authors
export const getAuthors = () => authApi.get(`${base}/authors`)
export const createAuthor = (data) => authApi.post(`${base}/authors`, data)
export const updateAuthor = (id, data) => authApi.put(`${base}/authors/${id}`, data)
export const deleteAuthor = (id) => authApi.delete(`${base}/authors/${id}`)

// Venues
export const getVenues = () => authApi.get(`${base}/venues`)
export const createVenue = (data) => authApi.post(`${base}/venues`, data)
export const updateVenue = (id, data) => authApi.put(`${base}/venues/${id}`, data)
export const deleteVenue = (id) => authApi.delete(`${base}/venues/${id}`)

// Types
export const getTypes = () => authApi.get(`${base}/types`)
export const createType = (data) => authApi.post(`${base}/types`, data)
export const updateType = (id, data) => authApi.put(`${base}/types/${id}`, data)
export const deleteType = (id) => authApi.delete(`${base}/types/${id}`)

// Categories
export const getCategories = () => authApi.get(`${base}/categories`)
export const createCategory = (data) => authApi.post(`${base}/categories`, data)
export const updateCategory = (id, data) => authApi.put(`${base}/categories/${id}`, data)
export const deleteCategory = (id) => authApi.delete(`${base}/categories/${id}`)

// Keywords
export const getKeywords = () => authApi.get(`${base}/keywords`)
export const createKeyword = (data) => authApi.post(`${base}/keywords`, data)
export const updateKeyword = (id, data) => authApi.put(`${base}/keywords/${id}`, data)
export const deleteKeyword = (id) => authApi.delete(`${base}/keywords/${id}`)