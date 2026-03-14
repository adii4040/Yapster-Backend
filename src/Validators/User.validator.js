import * as z from "zod";


const emailValidation = z.object({
    email: z
        .email({ message: "Invalid Email" })
        .trim(),
})

const loginUserValidation = emailValidation.extend({

    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(12, { message: "Password can not be more than 12 digits" })
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/,
            { message: "Password must include uppercase, lowercase, number, and special character" }
        )
        .trim(),
})
const registerUserValidation = loginUserValidation.extend({
    fullname: z
        .string()
        .trim()
        .min(1, "Fullname can't be empty"),
})

const resetPasswordValidation = z.object({
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(12, { message: "Password can not be more than 12 digits" })
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/,
            { message: "Password must include uppercase, lowercase, number, and special character" }
        )
        .trim(),
    confirmPassword: z
        .string()

}).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Confirm password does not match"
})

const updateUserValidation = z.object({
    fullname: z
    .string()
    .trim()
    .min(1, "Fullname can't be empty")
    .optional()
    .or(z.literal("")),

    email: z
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),

})


export {
    emailValidation,
    registerUserValidation,
    loginUserValidation,
    resetPasswordValidation,
    updateUserValidation
}