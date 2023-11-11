

// ======= custome validation for object-Id ========
const validationObjectId = (value, helper) => {
    return Types.ObjectId.isValid(value) ? true : helper.message('invalid id')
}

// ======= fields are used more than once ========
export const generalFields = {}