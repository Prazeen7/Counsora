import { apiRequest } from "./api";

export const saveCostSheet = (countryId, sheet) => apiRequest(`/cost-estimation/${encodeURIComponent(countryId)}`, {
    method: "PUT", body: JSON.stringify(sheet),
});
export const deleteCostSheet = (countryId) => apiRequest(`/cost-estimation/${encodeURIComponent(countryId)}`, { method: "DELETE" });

export const getCostSheet = (countryId, signal) =>
    apiRequest(`/cost-estimation/${encodeURIComponent(countryId)}`, { signal });

export const estimateCosts = (countryId, values, signal) =>
    apiRequest(`/cost-estimation/${encodeURIComponent(countryId)}/estimate`, {
        method: "POST", body: JSON.stringify({ values }), signal,
    });
