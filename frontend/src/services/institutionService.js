import { apiRequest } from "./api";

export function getInstitutions(params) {
    return apiRequest("/institution/get", {
        method: "POST",
        body: JSON.stringify(params),
    });
};

// Get a single institution by ID
export function getInstitutionById(id) {
    return apiRequest(`/institution/${id}`);
};

// Create a new institution
export function addInstitution(institutionData) {
    return apiRequest('/institution/add', {
        method: 'POST',
        body: JSON.stringify(institutionData),
    });
}