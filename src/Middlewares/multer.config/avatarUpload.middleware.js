import multer from 'multer'
import { ApiError } from '../../utils/ApiError.utils.js'

import fs from 'fs'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/avatar'
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        cb(null, dir)
    },
    filename: function (req, file, cb) {
        const filename = `${Date.now()}-${file.originalname}`
        cb(null, filename)
    }
})

const avatarFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new ApiError(401, "Avatar can only be an image type."))
    }
}

const uploadAvatar = multer({
    storage: storage,
    fileFilter: avatarFilter,
    limits: { fileSize: 20 * 1024 * 1024 } //20Mb limit
})


export default uploadAvatar