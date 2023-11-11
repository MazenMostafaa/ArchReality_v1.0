
//  Un-expected errors come from any part of router.
export const asyncHandler = (fn) => {
    return (req, res, next) => {

        // call function 
        fn(req, res, next)

            // .then() : Success case that Function did its work rightly

            // .catch() : fail case that Function did not do its work rightly
            .catch((err) => {

                console.log(err)
                res.status(500).json({ message: "Failed" })
            })
    }
}

//  Expected errors for fail cases come from all over the project.
export const globalResponse = (err, req, res, next) => {
    if (err) {
        if (req.validationErrorArr) {
            return res
                .status(err['cause'] || 400)
                .json({ message: req.validationErrorArr })
        }

        return res.status(err['cause'] || 500).json({ message: err.message })
    }
}