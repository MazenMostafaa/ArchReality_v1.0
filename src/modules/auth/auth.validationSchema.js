import joi from 'joi'
import { generalFields } from '../../utils/validationGeneralFields.js'

export const registerSchema = {
    body: joi
        .object({
            firstName: generalFields.firstName.required(),
            lastName: generalFields.lastName.required(),
            email: generalFields.email.required(),
            password: generalFields.password.required(),
            cPassword: joi.valid(joi.ref('password')).required(),


            role: generalFields.role.optional()
        }).required()
}

export const loginSchema = {
    body: joi
        .object({
            email: generalFields.email.optional(),
            password: generalFields.password.required(),
        }).required()
}

export const forgetPasswordSchema = {
    body: joi
        .object({
            email: generalFields.email.required(),
        }).required()
}

export const checkOTPSchema = {
    body: joi
        .object({
            otp: joi.number().min(4).required(),
            password: generalFields.password.required(),
            cPassword: joi.valid(joi.ref('password')).required(),
        }).required()
}