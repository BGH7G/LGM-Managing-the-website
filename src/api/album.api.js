import {authApi} from "@/utils/axios";

// Album API functions
// 获取相册列表
export const getAlbums = (params = {}) => {
  const {
    page = 1,
    size = 10
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('size', size);

  return authApi.get(`/album?${queryParams.toString()}`);
};

// 获取单个相册详情
export const getAlbumById = (id) => {
  return authApi.get(`/album/${id}`);
};

// 创建相册（包含封面文件）
export const createAlbum = (data = {}) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    formData.append(key, data[key]);
  });

  return authApi.post('/album/addAlbum', formData);
};

// 更新相册
export const updateAlbum = (id, data = {}) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    formData.append(key, data[key]);
  });

  return authApi.put(`/album/editAlbum/${id}`, formData);
};

// 删除相册
export const deleteAlbum = (id) => {
  return authApi.delete(`/album/deleteAlbum/${id}`);
};
