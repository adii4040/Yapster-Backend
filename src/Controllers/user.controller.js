import User from '../Models/User.model.js'
import { asyncHandler, ApiError, ApiResponse, uploadOnCloudinary, sendMail, emailVerificationMailGen, forgotPasswordReqMailGen, cookieOption, } from '../utils/index.js'



const generateRefreshAndAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) throw new ApiError(403, "Unauthorized Request")

        const accessToken = await user.generateAccessToken(user)
        const refreshToken = await user.generateRefreshToken(user)

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        console.log(500, "Something went wrong while generating the refresh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) throw new ApiError(409, `User already exists!`)

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) throw new ApiError(404, "Avatar file is required")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) throw new ApiError(404, "Avatar file is required!!")

    const user = await User.create({
        fullname,
        email,
        password,
        avatar: {
            url: avatar?.url,
            localpath: avatarLocalPath
        }
    })

    const createdUser = await User.findById(user._id).select(" -password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry")

    const { hashedToken, hashedTokenExpiry } = await user.generateRandomToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationTokenExpiry = hashedTokenExpiry
    await user.save({ validateBeforeSave: false })

    const userId = user._id.toString()
    const mailOptions = {
        from: "App Assistant <onboarding@resend.dev>",
        to: user.email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailGen(
            user.fullname,
            `${process.env.BASE_CLIENT_URL}/user/${userId}/verify-email/${hashedToken}`
        )
    }
    const result = await sendMail(mailOptions);

    if (!result.success) {
        throw new ApiError(500, "Failed to send verification email");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            { user: createdUser },
            "User registered successfully!!"
        )
    )

})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(404, "User not found!")

    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) throw new ApiError(401, "Invalid password")

    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(user._id)

    const logedInUser = await User.findById(user._id).select(" -password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry")


    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(
            new ApiResponse(
                200,
                { user: logedInUser },
                "User loged in successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) throw new ApiError(404, "User not found")

    user.refreshToken = null
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .clearCookie("accessToken", cookieOption)
        .clearCookie("refreshToken", cookieOption)
        .json(
            new ApiResponse(200, {}, "User loged out successfully!!")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: req.user
            },
            "Current user fetched successfully!!"
        )
    )
})


const getAllUsers = asyncHandler(async (req, res) => {
    const logedInUserId = req.user._id
    const allUsers = await User.find({ _id: { $ne: logedInUserId } })

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                users: !allUsers.length ? "No User found" : allUsers
            },
            "All users fetched succeessfully."
        )
    )
})

const verifyEmail = asyncHandler(async (req, res) => {
    const { id, emailVerificationToken } = req.params
    if (!emailVerificationToken) throw new ApiError(401, "No email verification token")

    const user = await User.findOne({ _id: id, emailVerificationToken })
    if (!user) throw new ApiError(403, "User not found or invalid email verification token!")

    if (user.isEmailVerified) throw new ApiError(401, "User Email is already verified")

    user.emailVerificationToken = undefined
    user.emailVerificationTokenExpiry = undefined
    user.isEmailVerified = true
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Email has been verfied!!"
            )
        )

})


const resendEmailVerification = asyncHandler(async (req, res) => {
    if (req.user.isEmailVerified) throw new ApiError(401, "User Email is already verified")

    const { hashedToken, hashedTokenExpiry } = await req.user.generateRandomToken()
    req.user.emailVerificationToken = hashedToken
    req.user.emailVerificationTokenExpiry = hashedTokenExpiry
    await req.user.save({ validateBeforeSave: false })

    const userId = req.user._id.toString()
    const mailOptions = {
        from: "App Assistant <onboarding@resend.dev>",
        to: req.user.email,
        subject: "Verify Your Email",
        mailgenContent: emailVerificationMailGen(
            req.user.fullname,
            `${process.env.BASE_CLIENT_URL}/user/${userId}/verify-email/${hashedToken}`
        )
    }

    const result = await sendMail(mailOptions)
    if (!result.success)

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Email verification code sent successfully!"
            )
        )
})

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) throw new ApiError(404, "User not found!!")

    const { hashedToken, hashedTokenExpiry } = await user.generateRandomToken()
    user.forgotPasswordToken = hashedToken
    user.forgotPasswordTokenExpiry = hashedTokenExpiry
    await user.save({ validateBeforeSave: false })

    const mailOptions = {
        from: "App Assistant <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset Your Password",
        mailgenContent: forgotPasswordReqMailGen(
            user.fullname,
            `${process.env.BASE_CLIENT_URL}/user/${hashedToken}/reset-forgot-password`
        )
    }

    const result = await sendMail(mailOptions);

    if (!result.success) {
        throw new ApiError(500, "Failed to send verification email");
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Forget Password link send successfully!!"
            )
        )
})

const resetForgotPassword = asyncHandler(async (req, res) => {
    const { password } = req.body
    const { forgotPasswordToken } = req.params
    if (!forgotPasswordToken) throw new ApiError(401, "No forgot password token")

    const user = await User.findOne({ forgotPasswordToken })
    if (!user) throw new ApiError(403, "Invalid forgot password token!")


    user.password = password
    user.forgotPasswordToken = undefined
    user.forgotPasswordTokenExpiry = undefined
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password has been changed"
        )
    )
})

const resetCurrentPassword = asyncHandler(async (req, res) => {
    const { id } = req.params
    if (id !== req.user._id.toString()) throw new ApiError(403, "Unauthorized request!!")

    const { password } = req.body

    const user = await User.findById(req.user._id)
    if (!user) throw new ApiError(404, "No user found!!")

    const isOldPassword = await user.isPasswordCorrect(password)
    if (isOldPassword) throw new ApiError(401, "No old password is allowed!!")

    req.user.password = password
    await req.user.save({ validateBeforeSave: false })


    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password has been changed"
            )
        )
})


const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (id !== req.user._id.toString()) throw new ApiError(403, "Unauthorized request!!")

    const { fullname, email } = req.body

    if (!fullname && !email && !req.file) throw new ApiError(400, "Atleast one field is required to update!!")

    const user = await User.findById(req.user._id)
    if (!user) throw new ApiError(404, "User not found!!")

    if (fullname) {
        user.fullname = fullname
    }

    if (email) {

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            throw new ApiError(409, "Email already exists!!")
        }

        user.email = email
        // If the email is changed, reset the email verification status and generate a new token
        user.isEmailVerified = false
        user.emailVerificationToken = undefined
        user.emailVerificationTokenExpiry = undefined

        // Generate a new email verification token
        // and send the verification email
        const { hashedToken, hashedTokenExpiry } = await user.generateRandomToken()
        user.emailVerificationToken = hashedToken
        user.emailVerificationTokenExpiry = hashedTokenExpiry
        await user.save({ validateBeforeSave: false })
        const userId = user._id.toString()
        const mailOptions = {
            from: "App Assistant <onboarding@resend.dev>",
            to: user.email,
            subject: "Verify Your Email",
            mailgenContent: emailVerificationMailGen(
                user.fullname,
                `${process.env.BASE_CLIENT_URL}/user/${userId}/verify-email/${hashedToken}`
            )
        }
        const result = await sendMail(mailOptions);

        if (!result.success) {
            throw new ApiError(500, "Failed to send verification email");
        }
    }

    if (req.file) {
        const avatarLocalPath = req.file.path
        if (!avatarLocalPath) throw new ApiError(404, "Avatar file is required")

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        if (!avatar) throw new ApiError(404, "Avatar file is required!!")

        user.avatar = {
            url: avatar?.url,
            localpath: avatarLocalPath
        }
    }

    await user.save({ validateBeforeSave: false })

    const updatedUser = await User.findById(user._id).select(" -password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry")

    return res.status(200).json(
        new ApiResponse(
            200,
            { user: updatedUser },
            "User updated successfully!!"
        )
    )
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies
    if (!refreshToken) throw new ApiError(401, "No refresh token found")

    const user = await User.findOne({ refreshToken })
    if (!user) throw new ApiError(403, "Invalid refresh token")

    const isRefreshTokenValid = await user.isRefreshTokenValid(refreshToken)
    if (!isRefreshTokenValid) throw new ApiError(403, "Invalid refresh token")
    const accessToken = await user.generateAccessToken(user)
    return res.status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .json(
            new ApiResponse(
                200,
                {},
                "Access token refreshed successfully!!"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    getAllUsers,
    verifyEmail,
    resendEmailVerification,
    forgotPasswordRequest,
    resetForgotPassword,
    resetCurrentPassword,
    updateUser,
}
