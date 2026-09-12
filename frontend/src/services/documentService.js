import { apiRequest } from "./api";

export function getDocuments({ country, type }) {
    const params = new URLSearchParams({ type });
    if (country) params.set("country", country);
    return apiRequest(`/documents?${params}`);
}

export function saveDocument(id, fields, files) {
    const body = new FormData();
    Object.entries(fields).forEach(([key, value]) => body.append(key, value));
    (Array.isArray(files) ? files : files ? [files] : []).forEach((file) => body.append("previews", file));
    return apiRequest(`/documents${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body, isFormData: true });
}

export const deleteDocument = (id) => apiRequest(`/documents/${id}`, { method: "DELETE" });
export const getDocumentPreview = (id, index = 0) => apiRequest(`/documents/${id}/preview?index=${index}`, { responseType: "blob" });
