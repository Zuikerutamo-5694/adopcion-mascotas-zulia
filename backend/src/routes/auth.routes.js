const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
} = require('../validators/auth.validator');
const { verifyToken } = require('../middlewares/auth');

const router = Router();

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', verifyToken, authController.me);
router.put('/me', verifyToken, updateProfileValidator, authController.updateMe);
router.patch('/me', verifyToken, updateProfileValidator, authController.updateMe);

module.exports = router;
