import {authApi} from "@/utils/axios";

export const getLocation = () => {
    return authApi.get('/location')
}