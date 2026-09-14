const URL = import.meta.env.VITE_BACKEND_URL;
import { apiFetch } from './authenticatedFetch';
export { apiFetch };

export async function apiRequest(endpoint, options = {}) {
    const response = await apiFetch(`${URL}${endpoint}`, options);

    if (response.ok && options.responseType === "blob") return response.blob();
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.error || "Request failed");
        error.code = data.code;
        error.emailSent = data.emailSent;
        error.verificationStatusToken = data.verificationStatusToken;
        error.verificationMessage = data.message;
        throw error;
    }

    return data;
}
