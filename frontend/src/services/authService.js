import { apiRequest } from "./api";

// Login
export function loginUser(credentials) {
return apiRequest("/auth/login", {
method: "POST",
body: JSON.stringify(credentials),
});
}

// Signup 
export function registerUser(userData) {
return apiRequest("/auth/signup", {
method: "POST",
body: JSON.stringify(userData),
});
}
