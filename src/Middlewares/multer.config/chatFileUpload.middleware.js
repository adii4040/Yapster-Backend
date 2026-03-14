import multer from 'multer'
import { ApiError } from '../../utils/ApiError.utils.js'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    const filename = `${Date.now()}-${file.originalname}`
    cb(null, filename)
  }
})

//File filter
const chatFileFilter = function (req, file, cb) {
  const { fieldname, mimetype } = file
  if ((fieldname === "sharedImg" && mimetype.startsWith('image/')) ||
    (fieldname === "sharedVideos" && mimetype.startsWith('video/')) ||
    (fieldname === "sharedFiles" && mimetype.startsWith('application/'))
  ) {
    cb(null, true)
  } else {
    cb(new ApiError(401, `Invalid file type for field "${fieldname}"`), false)
  }
}



const uploadChatFiles = multer({
  storage: storage,
  fileFilter: chatFileFilter
})

export default uploadChatFiles
