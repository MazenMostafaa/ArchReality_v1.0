

const reqMethods = ['body', 'query', 'params', 'headers', 'file', 'files']


export const validationFunction = (schema) => {
    return (req, res, next) => {

        let validationErrorArr = []

        for (const key of reqMethods) {

            if (schema[key]) {
                const validationResult = schema[key].validate(req[key], { abortEarly: false })

                // In case there is any error fill validation array with it
                if (validationResult.error) {
                    validationErrorArr.push(validationResult.error.details)
                }
            }

        }

        // Here ,how to deal with validation errors 
        if (validationErrorArr.length) {
            req.validationErrorArr = validationErrorArr

            // return errors to global response that responsible for ending APIs and return messages 
            return next(new Error('', { cause: 400 }))
        }

        next()
    }
}