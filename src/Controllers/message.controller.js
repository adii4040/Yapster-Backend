//Model
import User from '../Models/User.model.js'
import Message from '../Models/Message.model.js'
//Utils
import { asyncHandler, ApiError, ApiResponse, uploadOnCloudinary } from '../utils/index.js'
import { io, getReceiverSocketId } from '../socket.js'



const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId } = req.params
    if (!receiverId) throw new ApiError(401, 'No receiver id is provided.')

    const senderId = req.user._id

    const { text } = req.body

    let localsharedImgPath = null;
    let localsharedVideosPath = null;
    let localsharedFilesPath = null;

    if (req.files) {
        console.log(req.files.fieldname, req.files)
        if (req.files.sharedImg) {
            localsharedImgPath = req.files.sharedImg[0].path
        }
        if (req.files.sharedVideos) {
            localsharedVideosPath = req.files.sharedVideos[0].path
        }
        if (req.files.sharedFiles) {
            localsharedFilesPath = req.files.sharedFiles[0].path
        }
    }
    console.log(`image-localpath ${localsharedImgPath}, video-localpath ${localsharedVideosPath}, file-localpath ${localsharedFilesPath}`)


    const uploads = await Promise.all([
        localsharedImgPath && uploadOnCloudinary(localsharedImgPath),
        localsharedVideosPath && uploadOnCloudinary(localsharedVideosPath),
        localsharedFilesPath && uploadOnCloudinary(localsharedFilesPath)
    ]);

    const [sharedImg, sharedVideos, sharedFiles] = uploads;

    console.log(`image-url ${sharedImg?.url}, video-url ${sharedVideos?.url}, file-url ${sharedFiles?.url}`)

    const message = await Message.create({
        senderId,
        receiverId,
        text,
        attachments: {
            image: sharedImg?.url,
            video: sharedVideos?.url,
            file: sharedFiles?.secure_url
        }
    })

    const sendMessage = await Message.findById(message._id).populate("senderId", "fullname avatar").populate("receiverId", "fullname avatar")
    const receiverSocketId = getReceiverSocketId(receiverId)
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", sendMessage);
        console.log(sendMessage)
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            { message: sendMessage },
            'message sent successfully'
        )
    )
})

const getMessage = asyncHandler(async (req, res) => {
    const { receiverId } = req.params
    const receiver = await User.findById(receiverId)
    if (!receiver) throw new ApiError(404, "No receiver found!")
    const myId = req.user._id
    const messages = await Message.find({
        $or: [
            { senderId: myId, receiverId },
            { senderId: receiverId, receiverId: myId }
        ]
    }).populate("senderId", "fullname avatar").populate("receiverId", "fullname avatar")
    if (!messages.length) throw new ApiError(404, `You have no conversation with ${receiver.fullname}.`)

    return res.status(200).json(
        new ApiResponse(
            200,
            { messages },
            "All the messages are fetched successfully."
        )
    )
})

export {
    sendMessage,
    getMessage
}
