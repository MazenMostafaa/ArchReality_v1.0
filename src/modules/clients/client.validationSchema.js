import joi from 'joi'
import { generalFields } from '../../utils/validationGeneralFields.js'

export const updateSchema = {
    body: joi
        .object({

            firstName: generalFields.firstName.optional(),
            lastName: generalFields.lastName.optional(),

            password: generalFields.password.optional(),
            cPassword: joi.valid(joi.ref('password')).optional(),
            oldPassword: generalFields.password.optional(),

            file: generalFields.file.optional()

        })
        .required()
}