import { Router } from 'express'


//Controllers
import { registerUser, loginUser, logoutUser, getCurrentUser, getAllUsers, verifyEmail, resendEmailVerification, forgotPasswordRequest, resetForgotPassword, resetCurrentPassword, updateUser } from '../Controllers/user.controller.js'

//Middleware
import { validate, validationSource } from '../Middlewares/validate.middleware.js'
import uploadAvatar from '../Middlewares/multer.config/avatarUpload.middleware.js'
import {verifyJWT} from '../Middlewares/auth.middleware.js'

//Validators
import { emailValidation, registerUserValidation, loginUserValidation, resetPasswordValidation, updateUserValidation } from '../Validators/User.validator.js'





const router = Router()


router.route('/register').post(uploadAvatar.single("avatar"), validate(registerUserValidation, validationSource.BODY), registerUser)
router.route('/login').post(validate(loginUserValidation, validationSource.BODY), loginUser)
router.route('/:id/verify-email/:emailVerificationToken').get(verifyEmail)
router.route('/request-forgot-password').post(validate(emailValidation, validationSource.BODY), forgotPasswordRequest)
router.route('/:forgotPasswordToken/reset-forgot-password').put(validate(resetPasswordValidation, validationSource.BODY), resetForgotPassword)

//Secured Route
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/current-user').get(verifyJWT, getCurrentUser)
router.route('/all-users').get(verifyJWT, getAllUsers)
router.route('/resend-email-verification').post(verifyJWT, resendEmailVerification)
router.route('/:id/reset-password').put(verifyJWT, validate(resetPasswordValidation, validationSource.BODY), resetCurrentPassword)
router.route('/:id/update').put(verifyJWT, uploadAvatar.single("avatar"), validate(updateUserValidation, validationSource.BODY), updateUser)


export default router