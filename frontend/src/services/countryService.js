import { apiRequest } from "./api";

export function getAllCountries() {
    return apiRequest("/country/all");
}

export function updateCountry(id, changes) {
    return apiRequest(`/country/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}

export function createCountry(fields) {
    return apiRequest("/country", { method: "POST", body: JSON.stringify(fields) });
}

export function deleteCountry(id) {
    return apiRequest(`/country/${id}`, { method: "DELETE" });
}

// Get all countries
export function getCountries() {
    return apiRequest("/country/get");
}

// Get a single country by ID
export function getCountryById(id) {
    return apiRequest(`/country/${id}`);
}
