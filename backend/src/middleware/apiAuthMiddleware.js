const { authMiddleware } = require('./authMiddleware');
const publicPosts = new Set([
    '/auth/signup', '/auth/login', '/auth/verify-email',
    '/auth/verification-status', '/auth/resend-verification', '/auth/verification-email',
]);
function apiAuthMiddleware(req, res, next) {
    if (req.method === 'POST' && publicPosts.has(req.path)) return next();
    return authMiddleware(req, res, next);
}
module.exports = { apiAuthMiddleware };
