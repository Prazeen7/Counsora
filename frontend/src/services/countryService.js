import { apiRequest } from "./api";

// Get all countries
export function getCountries() {
    return apiRequest("/country/get");
}

// Get a single country by ID
export function getCountryById(id) {
    return apiRequest(`/country/${id}`);
}
