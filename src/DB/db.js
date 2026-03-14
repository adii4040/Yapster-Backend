import mongoose from 'mongoose'

export const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`)
        console.log(`\n MongoDb connected successfully!! DB host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error('Error while connecting to db', error)
        process.exit(1)
    }
}

