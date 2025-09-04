import { authApi } from '@/utils/axios';

/**
 * 生成激活码（管理员）
 * POST /activationCode/generate
 * @param {{ count: number, prefix?: string }} data
 */
export const generateActivationCodes = (data) => {
  return authApi.post('/activationCode/generate', data);
};

/**
 * 查看激活码列表（管理员）
 * GET /activationCode?limit=50&offset=0
 * @param {{ limit?: number, offset?: number }} params
 */
export const getActivationCodes = (params = {}) => {
  const { limit = 50, offset = 0 } = params;
  const query = new URLSearchParams();
  query.append('limit', limit);
  query.append('offset', offset);
  return authApi.get(`/activationCode?${query.toString()}`);
};

/**
 * 禁用激活码（管理员）
 * PUT /activationCode/:id/disable
 * @param {string|number} id
 */
export const disableActivationCode = (id) => {
  return authApi.put(`/activationCode/${id}/disable`);
};