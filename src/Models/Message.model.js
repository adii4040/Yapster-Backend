import mongoose, { Schema } from 'mongoose'

const messageSchema = new Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String
    },
    attachments: {
        type: {
            image: String,
            video: String,
            file: String
        }
    }
}, {
    timestamps: true
})

const Message = mongoose.model('Message', messageSchema)

export default Message