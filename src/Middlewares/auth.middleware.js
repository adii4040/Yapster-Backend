import jwt from 'jsonwebtoken'
import { asyncHandler, ApiError } from '../utils/index.js'
import User from '../Models/User.model.js';


const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
        if (!accessToken) throw new ApiError(401, "UnAuthorized request!! No token provided")

        const decodedtUserData = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY)

        const userData = await User.findById(decodedtUserData._id).select("-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry")
        if (!userData) throw new ApiError(401, 'Invalid Access Token')

        req.user = userData
        next()
    } catch (error) {
        next(new ApiError(401, "Please login first."))
    }
})

const verifyEmail = (req, _, next) => {
    if (!req.user.isEmailVerified) {
        throw new ApiError(409, "Please verify your email to chat!")
    }
    next()
}

export {
    verifyJWT,
    verifyEmail
}