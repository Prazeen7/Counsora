import { apiRequest } from "./api";

export function getDocuments({ country, type }) {
    const params = new URLSearchParams({ type });
    if (country) params.set("country", country);
    return apiRequest(`/documents?${params}`);
}

export function saveDocument(id, fields, file) {
    const body = new FormData();
    Object.entries(fields).forEach(([key, value]) => body.append(key, value));
    if (file) body.append("preview", file);
    return apiRequest(`/documents${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body, isFormData: true });
}

export const deleteDocument = (id) => apiRequest(`/documents/${id}`, { method: "DELETE" });
export const getDocumentPreview = (id) => apiRequest(`/documents/${id}/preview`, { responseType: "blob" });
