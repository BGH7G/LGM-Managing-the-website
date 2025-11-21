import { authApi } from "@/utils/axios";

// 1. 创建实验
export const createExperiment = (data) => {
    return authApi.post('/datasheet/experiment', data);
};

// 2. 获取实验列表
export const getExperiments = (params = {}) => {
    const {
        name,
        creator,
        page = 1,
        limit = 50
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    if (name) queryParams.append('name', name);
    if (creator) queryParams.append('creator', creator);

    return authApi.get(`/datasheet/experiments?${queryParams.toString()}`);
};

// 3. 获取实验详情
export const getExperimentById = (experimentId) => {
    return authApi.get(`/datasheet/experiment/${experimentId}`);
};

// 4. 删除实验
export const deleteExperiment = (experimentId) => {
    return authApi.delete(`/datasheet/experiment/${experimentId}`);
};

// 5. 添加字段定义
export const addColumnDefinition = (experimentId, data) => {
    return authApi.post(`/datasheet/experiment/${experimentId}/columns`, data);
};

// 6. 更新字段定义
export const updateColumnDefinition = (experimentId, columnId, data) => {
    return authApi.put(`/datasheet/experiment/${experimentId}/column/${columnId}`, data);
};

// 7. 删除字段定义
export const deleteColumnDefinition = (experimentId, columnId) => {
    return authApi.delete(`/datasheet/experiment/${experimentId}/column/${columnId}`);
};

// 8. 添加数据记录
export const addDataRecord = (experimentId, data) => {
    return authApi.post(`/datasheet/experiment/${experimentId}/data`, data);
};

// 9. 批量导入数据
export const batchImportData = (experimentId, dataList) => {
    return authApi.post(`/datasheet/experiment/${experimentId}/data/batch-import`, dataList);
};

// 10. 批量删除数据
export const batchDeleteData = (experimentId, dataIds) => {
    return authApi.post(`/datasheet/experiment/${experimentId}/data/batch-delete`, { dataIds });
};

// 11. 导出数据
export const exportData = (experimentId, params = {}) => {
    const {
        fieldName,
        fieldValue
    } = params;

    const queryParams = new URLSearchParams();
    if (fieldName) queryParams.append('fieldName', fieldName);
    if (fieldValue) queryParams.append('fieldValue', fieldValue);

    return authApi.get(`/datasheet/experiment/${experimentId}/data/export?${queryParams.toString()}`, {
        responseType: 'blob'
    });
};

// 12. 更新数据记录
export const updateDataRecord = (experimentId, dataId, data) => {
    return authApi.put(`/datasheet/experiment/${experimentId}/data/${dataId}`, data);
};

// 13. 删除数据记录
export const deleteDataRecord = (experimentId, dataId) => {
    return authApi.delete(`/datasheet/experiment/${experimentId}/data/${dataId}`);
};

// 14. 获取实验数据
export const getExperimentData = (experimentId, params = {}) => {
    const {
        page = 1,
        limit = 50,
        fieldName,
        fieldValue,
        sortBy,
        sortOrder
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    if (fieldName) queryParams.append('fieldName', fieldName);
    if (fieldValue) queryParams.append('fieldValue', fieldValue);
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortOrder) queryParams.append('sortOrder', sortOrder);

    return authApi.get(`/datasheet/experiment/${experimentId}/data?${queryParams.toString()}`);
};

// 15. CSV/Excel 导入数据
export const importCSVData = (experimentId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    return authApi.post(`/datasheet/experiment/${experimentId}/import-csv`, formData);
};
