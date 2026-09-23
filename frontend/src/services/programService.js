import { apiRequest } from "./api";

export function getProgramsByInstitution(institutionId, { signal, ...options } = {}) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== "all") params.set(key, value);
    });
    return apiRequest(`/program/institution/${institutionId}?${params}`, { signal });
}

export function getAllPrograms(){
    return apiRequest(`/program/get`);
}
