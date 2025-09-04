import {authApi} from "@/utils/axios";

export const getInfo = (params = {}) => {
    // 设置默认参数
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'id',
        sortOrder = 'ASC',
        gender,
        pregnant,
        fromDate,
        toDate,
        sheepNumber
    } = params;

    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('pageSize', pageSize);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    // 添加筛选条件
    if (gender) {
        queryParams.append('gender', gender);
    }
    if (pregnant !== undefined && pregnant !== null) {
        queryParams.append('pregnant', pregnant);
    }
    if (fromDate) {
        queryParams.append('fromDate', fromDate);
    }
    if (toDate) {
        queryParams.append('toDate', toDate);
    }
    if (sheepNumber) {
        queryParams.append('sheepNumber', sheepNumber);
    }

    return authApi.get(`/huSheep?${queryParams.toString()}`);
}

export const getOneInfo = (id)=>{
    return authApi.get(`/huSheep/${id}`)
}

export const addInfo = (data) => {
    return authApi.post('/huSheep/submit/sheep', data);
}

export const editInfo = (id, data) => {
    return authApi.put(`/huSheep/update/sheep/${id}`, data);
}

export const deleteInfo = (id) => {
    return authApi.delete(`/huSheep/delete/${id}`);
}

// 批量删除，后端需要 { "sheepId": [id1, id2] }
export const deleteBatchInfo = (ids = []) => {
    return authApi.delete('/huSheep/delete', { data: { sheepId: ids } });
}

// 提交断奶/屠宰等年龄里程碑信息
export const submitAgeMilestone = (data) => {
    // data 示例: { age_days: 90, milestone_name: '屠宰', description: '还是屠宰' }
    return authApi.post('/huSheep/submit/ageMilestone', data);
}

// 获取年龄里程碑列表（去重结果）
export const getAgeMilestones = (params = {}) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'id',
        sortOrder = 'ASC'
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('pageSize', pageSize);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    return authApi.get(`/huSheep/age-milestones?${queryParams.toString()}`);
}

export const postAgeMilestone = data => {
  return authApi.post('/huSheep/submit/ageMilestone', data);
}

// 提交种属指数等综合指标信息
export const submitIndexInfo = (data) => {
    return authApi.post('/huSheep/submit/index', data);
}