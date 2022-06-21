const { login } = require('../controllers/auth.controller');
const router = require('./surat.route');

router.post('/login', login);

module.exports = router;
