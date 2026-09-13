import { apiRequest } from "./api";

export const getCostSheet = (countryId, signal) =>
    apiRequest(`/cost-estimation/${encodeURIComponent(countryId)}`, { signal });

export const estimateCosts = (countryId, values, signal) =>
    apiRequest(`/cost-estimation/${encodeURIComponent(countryId)}/estimate`, {
        method: "POST", body: JSON.stringify({ values }), signal,
    });
