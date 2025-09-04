import {authApi} from "@/utils/axios";

// 获取图片列表，可按相册过滤
// options: { page, pageSize, sortBy, sortOrder, albumId }
export const getPhotos = (options = {}) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'id',
    sortOrder = 'ASC',
    albumId = null
  } = options;

  const params = { page, pageSize, sortBy, sortOrder };
  const url = albumId !== null && albumId !== undefined ? `/image/${albumId}` : '/image';
  return authApi.get(url, { params });
};

/**
 * 上传图片到服务器
 * @param {Object} data - 上传数据对象
 * @param {string} data.name - 图片名称
 * @param {string} data.description - 图片描述
 * @param {File|File[]} data.images - 要上传的图片文件或文件数组
 * @returns {Promise<axios.AxiosResponse<any>>} - 服务器响应
 */
export const uploadImage = (data = {}) => {
    const formData = new FormData();
    // 普通字段
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.albumId) formData.append('albumId', data.albumId);

    // 文件字段（支持单个或数组）
    const imgs = Array.isArray(data.images) ? data.images : [data.images];
    imgs.forEach((file) => {
        if (file) formData.append('images', file);
    });

    return authApi.post('/image/addImage', formData);
};

export const deleteImage = (id) => {
    return authApi.delete(`/image/deleteImage/${id}`);
}