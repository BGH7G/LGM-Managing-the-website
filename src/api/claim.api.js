import {authApi} from "@/utils/axios";

// 获取报账列表（普通用户返回自己的，管理员返回全部）
export const getClaims = (params = {}) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'updatedAt',
        sortOrder = 'DESC',
        status // pending / approved / rejected
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('pageSize', pageSize);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);
    if (status) queryParams.append('status', status);

    return authApi.get(`/claim?${queryParams.toString()}`);
};

// 获取报账详情（只能查看自己的）
export const getClaimById = (id) => {
    return authApi.get(`/claim/${id}`);
};

// 创建报账（普通用户、管理员均可）
export const createClaim = (data) => {
    return authApi.post('/claim', data);
};

// 更新报账（仅申请人在 pending 状态下可修改）
export const updateClaim = (id, data) => {
    return authApi.put(`/claim/${id}`, data);
};

// 删除报账（管理员可删，普通用户可删自己的 pending 报账）
export const deleteClaim = (id) => {
    return authApi.delete(`/claim/${id}`);
};

// 审批通过（仅管理员）
export const approveClaim = (id) => {
    return authApi.post(`/claim/${id}/approve`);
};

// 驳回（仅管理员）
export const rejectClaim = (id, data = {}) => {
    // 可以在 data 中附带驳回原因等信息
    return authApi.post(`/claim/${id}/reject`, data);
};
