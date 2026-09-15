const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const { getDashboard } = require('../controllers/dashboardController');
router.get('/', authMiddleware, adminMiddleware, getDashboard);
module.exports = router;
