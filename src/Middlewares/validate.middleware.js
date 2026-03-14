import mongoose from 'mongoose'
import { ApiError } from "../utils/index.js"

const validationSource = {
    BODY: "body",
    PARAMS: "params",
    HEADERS: "headers",
    QUERY: "query"
}

const validate = (schema, source = validationSource.BODY) => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source])

        if (!result.success) {
            console.error(`Error while validating ${result.error.issues[0].path[0]} : ${result.error.issues[0].message}`)
            return next(new ApiError(401, `Invalid ${result.error.issues[0].path[0]}: ${result.error.issues[0].message}`))
        }

        req[source] = result.data
        next()
    }
}


const validateObjectId = (paramName = "id") => {
    return (req, res, next) => {
        const id = req.params[paramName]
        if(!mongoose.Types.ObjectId.isValid(id)) next(new ApiError(401, `Invalid ${id}: Not a valid ObjectId `))

        next()
    }
}


export {
    validationSource, 
    validate,
    validateObjectId,

}