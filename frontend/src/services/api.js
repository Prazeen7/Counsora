const URL = import.meta.env.VITE_BACKEND_URL;

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    
    // Check if it's FormData
    const isFormData = options.isFormData || options.body instanceof FormData;
    
    const headers = {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
    };
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${URL}${endpoint}`, {
        headers,
        ...options,
    });

    const data = await response.json().catch(() => ({}));

    // Handle unauthorized globally
    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.setItem(
            "logoutMessage",
            data.error || "Your session has expired. Please log in again."
        );

        window.location.href = "/login";

        // Stop execution
        throw new Error("Unauthorized");
    }

    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}
