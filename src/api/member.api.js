import {authApi} from '@/utils/axios'

// 获取成员列表（分页、排序）
export const getMembers = (params = {}) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'id',
    sortOrder = 'ASC'
  } = params

  const queryParams = new URLSearchParams()
  queryParams.append('page', page)
  queryParams.append('pageSize', pageSize)
  queryParams.append('sortBy', sortBy)
  queryParams.append('sortOrder', sortOrder)

  return authApi.get(`/member?${queryParams.toString()}`)
}

// 获取所有角色
export const getRoles = () => authApi.get('/member/roles')

// 获取所有专业领域/技能
export const getExpertises = () => authApi.get('/member/expertises')

// 创建新成员（需要管理员权限）
// data 可为普通对象或包含 avatar 文件的 FormData
export const createMember = (data) => authApi.post('/member', data)

// 更新成员
export const updateMember = (id, data) => authApi.put(`/member/${id}`, data)

// 删除成员
export const deleteMember = (id) => authApi.delete(`/member/${id}`)

// 角色相关 CRUD
export const createRole = (data) => authApi.post('/member/roles', data)
export const updateRole = (id, data) => authApi.put(`/member/roles/${id}`, data)
export const deleteRole = (id) => authApi.delete(`/member/roles/${id}`)

// 专业领域/技能相关 CRUD
export const createExpertise = (data) => authApi.post('/member/expertises', data)
export const updateExpertise = (id, data) => authApi.put(`/member/expertises/${id}`, data)
export const deleteExpertise = (id) => authApi.delete(`/member/expertises/${id}`)