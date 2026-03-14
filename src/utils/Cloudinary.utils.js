import dotenv from 'dotenv'
dotenv.config()


import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import { ApiError } from './ApiError.utils.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) throw new ApiError(401, "No file to upload on cloudinary")

        const uploadResponse = await cloudinary.uploader
            .upload(localfilepath, {
                resource_type: "auto",
                secure: true
            })

        fs.unlinkSync(localfilepath)
        return uploadResponse

    } catch (error) {
        fs.unlinkSync(localfilepath)
        console.error(`Error while uploading on cloudinary, ERROR: ${error}`)
        return null
    }
}


export {uploadOnCloudinary}

