import { verifyToken, generateToken } from "../utils/tokenFunctions.js"

export const isAuth = (roles) => {
    return (req, res, next) => {

        const { authorization } = req.headers

        if (!authorization) {
            return next(new Error("Please Login first", { cause: 400 }))
        }

        if (!authorization.startsWith(process.env.TOKEN_PREFIX)) {
            return next(new Error("invalid token prefix", { cause: 400 }))
        }

        // Geting the token without a prefix word
        const splittedToken = authorization.split(' ')[1]

        // Phase refresh token
        try {
            const decodedData = verifyToken({ token: splittedToken, signature: process.env.LOGIN_SIGN })

            // const findUser = await userModel.findById(
            //     decodedData._id,
            //     'email userName role')
            // if (!findUser) {
            //     return res.status(400).json({ message: 'Please SignUp' })
            // }
            /// ============================= Authorization ===================
            // if (!roles.includes(findUser.role)) {
            //     return next(
            //         new Error('Unauthorized to access this API', { cause: 401 }),
            //     )
            // }

            req.authUser = authorizedUser
            next()
        } catch (error) {

            if (error == 'TokenExpiredError: jwt expired') {

                // const user = await userModel.findOne({ token: splittedToken })

                // if (!user) {
                //     return res.status(400).json({ Message: "In valid user related to this token" })
                // }

                // NOTE : this generation must looks like the token is generated in Login API
                // const userToken = generateToken({
                //     payload: { _id: user._id, role: user.role, email: user.email },
                //     signature: process.env.SIGN_IN_TOKEN_SECRET,
                //     expiresIn: "2d",
                // })

                // if (!userToken) {
                //     return next(
                //         new Error('token generation fail try again', {
                //             cause: 400,
                //         }),
                //     )
                // }

                // await userModel.findOneAndUpdate(
                //     { token: splittedToken },
                //     { token: userToken },
                //     { new: true }
                // )
                // return res.status(201).json({ Message: "Token is refreshed", newToken: userToken })
            }
            return next(new Error("In-valid Token", { cause: 400 }))
        }

    }
}