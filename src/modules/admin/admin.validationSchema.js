import joi from 'joi'
import { generalFields } from '../../utils/validationGeneralFields.js'
import { systemRoles } from '../../utils/systemRoles.js'

export const createSchema = {
    body: joi
        .object({
            email: generalFields.email.required(),
            password: generalFields.password.required(),
            role: joi.string().allow(systemRoles.ADMIN, systemRoles.ENGINEER).required()
        }).required()
}
export const loginSchema = {
    body: joi
        .object({
            email: generalFields.email.optional(),
            password: generalFields.password.required(),
        }).required()
}

export const updateSchema = {
    body: joi
        .object({

            firstName: generalFields.firstName.optional(),
            lastName: generalFields.lastName.optional(),
            password: joi.string().min(5).max(15).optional(),
            cPassword: joi.valid(joi.ref('password')).optional(),
            oldPassword: joi.string().min(5).max(15).optional(),
            file: generalFields.file.optional()

        })
        .required()
}

export const AddProjSchema = {
    body: joi
        .object({
            title: joi.string().min(5).max(55).lowercase().required(),
            desc: joi.string().max(250).optional(),
            propType: joi.string().allow('exterior', 'interior').required(),
        }).required(),

    // files: generalFields.files.required(),

    query: joi.object({
        createdBy: generalFields.Id.required(),
        assignedTo: generalFields.Id.optional(),
    }).required()
}
