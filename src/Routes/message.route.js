import express, { Router } from 'express'

//Controllers
import { sendMessage, getMessage } from '../Controllers/message.controller.js'
//Middleware 
import { verifyJWT, verifyEmail } from '../Middlewares/auth.middleware.js'
import uploadChatFiles from '../Middlewares/multer.config/chatFileUpload.middleware.js'
import { validateObjectId } from '../Middlewares/validate.middleware.js'
import { get } from 'mongoose'


const router = Router()


router.route('/:receiverId/send').post(verifyJWT, verifyEmail, uploadChatFiles.fields([
    { name: 'sharedImg', maxCount: 1 },
    { name: 'sharedVideos', maxCount: 1 },
    { name: 'sharedFiles', maxCount: 1 }
]), validateObjectId("receiverId"), sendMessage)

router.route('/:receiverId/get-message').get(verifyJWT, validateObjectId("receiverId"), getMessage)


export default router