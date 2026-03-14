import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'


//Utils
import { ApiError } from '../utils/index.js'

const userSchema = new Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: {
            url: String,
            localpath: String
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
    },
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordTokenExpiry: {
        type: Date,
    },
    emailVerificationToken: {
        type: String,
    },
    emailVerificationTokenExpiry: {
        type: Date,
    },

}, {
    timestamps: true
})

//Encrypt the password just before saving it, for encryption we are using bcrypt
userSchema.pre("save", async function (next) {
    const user = this
    try {
        if (!user) return ApiError(404, 'User not exists')

        if (!user.isModified("password")) return next()
        user.password = await bcrypt.hash(user.password, 10)

        next()
    } catch (error) {
        next(`Error while encrypting the password ${error}`)
    }
})


//Method to check if the given password matches the password in the DB
userSchema.methods.isPasswordCorrect = async function (password) {
    const user = this
    return await bcrypt.compare(password, user.password)

}

//Method to create the accesstoken
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        fullname: this.fullname,
        email: this.email,
        avatar: this.avatar,
        isEmailVerified: this.isEmailVerified,
    },
        process.env.ACCESS_TOKEN_SECRET_KEY,
        {
            expiresIn: 15 * 60 * 1000 // 15m
        })
}

//Method to create the refreshtoken
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET_KEY,
        {
            expiresIn: 7 * 24 * 60 * 60 * 1000 //7days
        })
}

//Method to generate a random token for email verification
userSchema.methods.generateRandomToken = function () {
    const unhashedToken = crypto.randomBytes(20).toString('hex')
    const hashedToken = crypto
        .createHash("sha256")
        .update(unhashedToken)
        .digest("hex")
    const hashedTokenExpiry = Date.now() + (15 * 60 * 1000) // 15m

    return { unhashedToken, hashedToken, hashedTokenExpiry }
}

userSchema.methods.isRefreshTokenValid = function (token) {
    const user = this
    if (!user.refreshToken) return false
    const isValid = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) return false
        return decoded._id === user._id.toString()
    })
    return isValid
}



const User = new mongoose.model('User', userSchema)

export default User