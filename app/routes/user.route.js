const router = require('express').Router();
const {
  info, all, add, changePassword, deleteUser, changeAdminStatus, changeUsername, changeName, logout,
} = require('../controllers/user.controller');

router.get('/info', info);
router.get('/all', all);
router.post('', add);
router.post('/logout', logout);
router.put('/password', changePassword);
router.put('/username', changeUsername);
router.put('/name', changeName);
router.delete('/:username', deleteUser);
router.patch('/:username/admin', changeAdminStatus);

module.exports = router;
