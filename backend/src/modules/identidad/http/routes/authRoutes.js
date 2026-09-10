import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  authRegisterRules,
  authLoginRules,
  authVerifyEmailRules,
  authForgotPasswordRules,
  authResetPasswordRules,
} from '../middlewares/validators.js';
import * as controller from '../controllers/authController.js';

const router = express.Router();

router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

router.post('/register', authRegisterRules, validate, controller.register);
router.post('/login', authLoginRules, validate, controller.login);
router.get('/verify-email', authVerifyEmailRules, validate, controller.verifyEmail);
router.post('/forgot-password', authForgotPasswordRules, validate, controller.forgotPassword);
router.post('/reset-password', authResetPasswordRules, validate, controller.resetPassword);

export default router;