import {authApi} from '@/utils/axios'

// 获取新闻列表（分页、排序、筛选）
export const getNews = (params = {}) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'publishedAt',
    sortOrder = 'DESC',
    status,
    categoryId,
    tagId,
    keyword
  } = params

  const query = new URLSearchParams()
  query.append('page', page)
  query.append('pageSize', pageSize)
  query.append('sortBy', sortBy)
  query.append('sortOrder', sortOrder)
  if (status) query.append('status', status)
  if (categoryId !== undefined && categoryId !== null && categoryId !== '') query.append('categoryId', categoryId)
  if (tagId !== undefined && tagId !== null && tagId !== '') query.append('tagId', tagId)
  if (keyword !== undefined && keyword !== null && keyword !== '') query.append('keyword', keyword)

  return authApi.get(`/news?${query.toString()}`)
}

// 获取新闻详情
export const getNewsById = (id) => authApi.get(`/news/${id}`)

// 点赞新闻（需要登录）
export const likeNews = (id) => authApi.post(`/news/${id}/like`)

// 创建新闻（需要管理员权限）
// data 可为普通对象或包含 cover 文件的 FormData（封面字段名：'cover'）
export const createNews = (data) => authApi.post('/news', data)

// 更新新闻（需要管理员权限）
export const updateNews = (id, data) => authApi.put(`/news/${id}`, data)

// 删除新闻（需要管理员权限）
export const deleteNews = (id) => authApi.delete(`/news/${id}`)

// 分类相关
export const getNewsCategories = () => authApi.get('/news/categories')
export const createNewsCategory = (data) => authApi.post('/news/categories', data)
export const updateNewsCategory = (id, data) => authApi.put(`/news/categories/${id}`, data)
export const deleteNewsCategory = (id) => authApi.delete(`/news/categories/${id}`)

// 标签相关
export const getNewsTags = () => authApi.get('/news/tags')
export const createNewsTag = (data) => authApi.post('/news/tags', data)
export const updateNewsTag = (id, data) => authApi.put(`/news/tags/${id}`, data)
export const deleteNewsTag = (id) => authApi.delete(`/news/tags/${id}`)
