import {authApi} from "@/utils/axios";

export const getGoods = (params = {}) => {
    // 设置默认参数
    const {
        page = 1,
        pageSize = 50,
        sortBy = 'updatedAt',
        sortOrder = 'DESC',
        search,
        location,
        tags,
        fromDate,
        toDate,
        minPrice,
        maxPrice,
        buyer,
        department
    } = params;

    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('pageSize', pageSize);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    // 添加筛选条件
    if (search) {
        queryParams.append('search', search);
    }
    if (location) {
        queryParams.append('location', location);
    }
    if (tags) {
        queryParams.append('tags', tags);
    }
    if (fromDate) {
        queryParams.append('fromDate', fromDate);
    }
    if (toDate) {
        queryParams.append('toDate', toDate);
    }
    if (minPrice !== undefined && minPrice !== null) {
        queryParams.append('minPrice', minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null) {
        queryParams.append('maxPrice', maxPrice);
    }
    if (buyer) {
        queryParams.append('buyer', buyer);
    }
    if (department) {
        queryParams.append('department', department);
    }

    return authApi.get(`/sample?${queryParams.toString()}`);
}

export const addGoods = (data) => {
    return authApi.post('/sample/sampleAdd', data);
}

export const deleteGoods = (id) => {
    return authApi.delete(`/sample/sampleDelete/${id}`);
}

export const editGoods = (id, data) => {
    return authApi.put(`/sample/sampleEdit/${id}`, data);
}