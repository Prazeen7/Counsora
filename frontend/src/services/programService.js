import { apiRequest } from "./api";

export function getProgramsByInstitution(institutionId, { includeInactive = false } = {}) {
    return apiRequest(`/program/institution/${institutionId}${includeInactive ? "?includeInactive=true" : ""}`);
}

export function getAllPrograms(){
    return apiRequest(`/program/get`);
}
