import {authApi} from "@/utils/axios";

// 1. 获取代码分享列表
export const getCodeShareList = (params = {}) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    language,
    omicsType,
    authorName,
    status = 'normal'
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('pageSize', pageSize);
  queryParams.append('sortBy', sortBy);
  queryParams.append('sortOrder', sortOrder);
  queryParams.append('status', status);
  
  if (language) queryParams.append('language', language);
  if (omicsType) queryParams.append('omicsType', omicsType);
  if (authorName) queryParams.append('authorName', authorName);

  return authApi.get(`/code?${queryParams.toString()}`);
};

// 2. 获取单个代码分享详情
export const getCodeShareById = (id) => {
  return authApi.get(`/code/${id}`);
};

// 3. 创建代码分享
export const createCodeShare = (data = {}) => {
  const formData = new FormData();
  
  // 添加基本字段
  if (data.fileName) formData.append('fileName', data.fileName);
  if (data.authorName) formData.append('authorName', data.authorName);
  if (data.language) formData.append('language', data.language);
  if (data.omicsType) formData.append('omicsType', data.omicsType);
  if (data.description) formData.append('description', data.description);
  if (data.content) formData.append('content', data.content);
  
  // 添加代码文件
  if (data.codeFile) {
    formData.append('codeFile', data.codeFile);
  }
  
  // 添加预览图（支持多张）
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }

  return authApi.post('/code', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 4. 更新代码分享
export const updateCodeShare = (id, data = {}) => {
  const formData = new FormData();
  
  // 添加基本字段（所有字段可选）
  if (data.fileName) formData.append('fileName', data.fileName);
  if (data.authorName) formData.append('authorName', data.authorName);
  if (data.language) formData.append('language', data.language);
  if (data.omicsType) formData.append('omicsType', data.omicsType);
  if (data.description) formData.append('description', data.description);
  if (data.content) formData.append('content', data.content);
  
  // 添加代码文件
  if (data.codeFile) {
    formData.append('codeFile', data.codeFile);
  }
  
  // 添加新的预览图
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }

  return authApi.put(`/code/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 5. 删除代码分享（软删除）
export const deleteCodeShare = (id) => {
  return authApi.delete(`/code/${id}`);
};

// 6. 删除预览图
export const deletePreviewImage = (imageId) => {
  return authApi.delete(`/code/images/${imageId}`);
};

// 7. 设置封面图
export const setCoverImage = (codeId, imageId) => {
  return authApi.put(`/code/${codeId}/cover/${imageId}`);
};

// 8. 下载文件
export const downloadCodeFile = (id) => {
  return authApi.get(`/code/${id}/download`, {
    responseType: 'blob' // 重要：指定响应类型为 blob
  });
};

// 9. 获取下载日志
export const getDownloadLogs = (id, params = {}) => {
  const {
    page = 1,
    pageSize = 10
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('pageSize', pageSize);

  return authApi.get(`/code/${id}/download-logs?${queryParams.toString()}`);
};

// 10. 获取语言列表
export const getLanguages = () => {
  return authApi.get('/code/languages');
};

// 11. 获取组学类型列表
export const getOmicsTypes = () => {
  return authApi.get('/code/omics-types');
};