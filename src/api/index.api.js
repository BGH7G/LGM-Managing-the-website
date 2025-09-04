import {authApi} from "@/utils/axios";

export const getIndex = (params = {})=>{
    const { page = 1, pageSize = 10 } = params;
    const query = new URLSearchParams();
    query.append('page', page);
    query.append('pageSize', pageSize);
    return authApi.get(`/huSheep/sheep-indexes?${query.toString()}`)
}

export const getExpIndex = ()=>{
    // 下载示例 XLSX，使用二进制响应
    return authApi.get(`/huSheep/template/index`, { responseType: 'blob' })
}

export const importHuSheepIndex = (file, { dryRun = false, onUploadProgress } = {}) => {
    const form = new FormData();
    form.append('file', file);

    const query = new URLSearchParams();
    query.append('dryRun', String(dryRun));

    const config = {};
    if (typeof onUploadProgress === 'function') {
        config.onUploadProgress = onUploadProgress;
    }

    return authApi.post(`/huSheep/import/index?${query.toString()}`, form, config);
}