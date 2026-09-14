import { apiRequest } from './api';
export const getStudyGuides = (country) => apiRequest(`/study-guides?${new URLSearchParams({ country })}`);
export const saveStudyGuide = (id, fields) => apiRequest(`/study-guides${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(fields) });
export const deleteStudyGuide = (id) => apiRequest(`/study-guides/${id}`, { method: 'DELETE' });
