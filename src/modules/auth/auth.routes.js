import { Router } from "express";
import { asyncHandler } from "../../utils/errorHandler.js";
import * as ac from './auth.controller.js'
import { validationFunction } from '../../middlewares/validation.js'
import * as validator from './auth.validationSchema.js'

const router = Router()

router.post('/register', validationFunction(validator.registerSchema), asyncHandler(ac.register))
router.get('/confirmEmail/:token', asyncHandler(ac.confirmEmail))

router.post('/login', validationFunction(validator.loginSchema), asyncHandler(ac.login))

router.post('/google', asyncHandler(ac.loginWithGmail))

router.post('/forget',
    validationFunction(validator.forgetPasswordSchema),
    asyncHandler(ac.forgetPassword))

router.post('/checkOTP',
    validationFunction(validator.checkOTPSchema),
    asyncHandler(ac.checkOTP))

router.put('/resetPass',
    validationFunction(validator.resetPasswordSchema),
    asyncHandler(ac.resetPassword))

router.post('/logout',
    validationFunction(validator.LogOutSchema),
    asyncHandler(ac.logout))

export default router