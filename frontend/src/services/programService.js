import { apiRequest } from "./api";

export function getProgramsByInstitution(institutionId) {
    return apiRequest(`/program/institution/${institutionId}`);
}

export function getAllPrograms(){
    return apiRequest(`/program/get`);
}