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

// Create a new institution with optional logo file
export function addInstitution(institutionData, logoFile = null) {
    const formData = new FormData();
    
    // If logo file is provided, append it
    if (logoFile) {
        formData.append('logo', logoFile);
    }
    
    // Append all other data as JSON string
    Object.keys(institutionData).forEach(key => {
        if (key !== 'logo') {
            formData.append(key, typeof institutionData[key] === 'object' 
                ? JSON.stringify(institutionData[key]) 
                : institutionData[key]);
        }
    });
    
    return apiRequest('/institution/add', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
        isFormData: true,
    });
}

function uploadImport(endpoint, file, extra = {}) {
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(extra).forEach(([key, value]) => formData.append(key, typeof value === "string" ? value : JSON.stringify(value)));
    return apiRequest(endpoint, { method: "POST", body: formData, isFormData: true });
}

export function discoverSpreadsheetGroups(file) {
    return uploadImport("/institution/import/groups", file);
}

export function extractInstitutionsFromSpreadsheet(file, groupId, sessionId) {
    return uploadImport("/institution/import/extract-institutions", file, { groupId, sessionId });
}

export function extractProgramsFromSpreadsheet(file, institutions, groupId, sessionId) {
    return uploadImport("/institution/import/extract-programs", file, { institutions, groupId, sessionId });
}

export function commitInstitutionImport(institutions, programs, sessionId, groupId) {
    return apiRequest("/institution/import/commit", { method: "POST", body: JSON.stringify({ institutions, programs, sessionId, groupId }) });
}
