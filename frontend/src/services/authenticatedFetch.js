const API_URL = import.meta.env.VITE_BACKEND_URL;
const publicPosts = new Set([
    '/auth/signup', '/auth/login', '/auth/verify-email',
    '/auth/verification-status', '/auth/resend-verification', '/auth/verification-email',
]);

function invalidateSession(message) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.setItem('logoutMessage', message);
    window.location.href = '/login';
}

export async function apiFetch(url, options = {}) {
    const base = new URL(API_URL, window.location.origin);
    const target = new URL(url, window.location.origin);
    const prefix = base.pathname.replace(/\/$/, '');
    if (target.origin !== base.origin || !target.pathname.startsWith(prefix + '/')) {
        throw new Error('API requests must target the configured backend.');
    }
    const endpoint = target.pathname.slice(prefix.length);
    const method = (options.method || 'GET').toUpperCase();
    const isPublic = method === 'POST' && publicPosts.has(endpoint);
    const token = localStorage.getItem('token')?.trim();
    const validToken = token && !['null', 'undefined'].includes(token);
    if (!isPublic && !validToken) {
        invalidateSession('Please log in to continue.');
        throw new Error('Authentication token is missing');
    }
    const headers = new Headers(options.headers);
    // Custom headers must never override or discard the current session token.
    headers.delete('Authorization');
    if (validToken) headers.set('Authorization', `Bearer ${token}`);
    if (options.isFormData || options.body instanceof FormData) headers.delete('Content-Type');
    else if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const requestOptions = { ...options, method, headers };
    delete requestOptions.isFormData;
    delete requestOptions.responseType;
    const response = await fetch(target.href, requestOptions);
    if (response.status === 401 && !isPublic) invalidateSession('Your session has expired. Please log in again.');
    return response;
}
