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
