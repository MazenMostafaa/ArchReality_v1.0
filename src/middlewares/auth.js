import { verifyToken, generateToken } from "../utils/tokenFunctions.js"
import { userModel } from '../../db/models/userModel.js'
import { adminModel } from "../../db/models/adminModel.js"

export const isAuth = (roles) => {
    return async (req, res, next) => {

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

            const findUser = await userModel.findById(
                decodedData._id,
                '_id email role token')
            if (!findUser) {
                return res.status(400).json({ message: 'Please Register first' })
            }
            // / ============================= Authorization ===================
            if (!roles.includes(findUser.role)) {
                return next(
                    new Error('Unauthorized to access this API', { cause: 401 }),
                )
            }

            req.authUser = findUser
            next()
        } catch (error) {

            if (error == 'TokenExpiredError: jwt expired') {

                const user = await userModel.findOne({ token: splittedToken })

                if (!user) {
                    return res.status(400).json({ Message: "In valid user related to this token" })
                }

                // NOTE : this generation must looks like the token is generated in Login API
                const userToken = generateToken({
                    payload: { _id: user._id, role: user.role, email: user.email },
                    signature: process.env.LOGIN_SIGN,
                    expiresIn: "2d",
                })

                if (!userToken) {
                    return next(
                        new Error('token generation fail try again', {
                            cause: 400,
                        }),
                    )
                }

                await userModel.findOneAndUpdate(
                    { token: splittedToken },
                    { token: userToken },
                    { new: true }
                )
                return res.status(201).json({ Message: "Token is refreshed", newToken: userToken })
            }
            return next(new Error("In-valid Token", { cause: 400 }))
        }

    }
}


export const adminAuth = (roles) => {
    return async (req, res, next) => {

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

            const findAdmin = await adminModel.findOne({ email: decodedData.email })
            if (!findAdmin) {
                return res.status(400).json({ message: 'Unauthorized to access this API' })
            }
            // / ============================= Authorization ===================
            if (!roles.includes(findAdmin.role)) {
                return next(
                    new Error('Unauthorized to access this API', { cause: 401 }),
                )
            }

            req.authAdmin = findAdmin
            next()
        } catch (error) {

            if (error == 'TokenExpiredError: jwt expired') {

                const user = await adminModel.findOne({ token: splittedToken })

                if (!user) {
                    return res.status(400).json({ Message: "In valid user related to this token" })
                }

                // NOTE : this generation must looks like the token is generated in Login API
                const userToken = generateToken({
                    payload: { email: user.email },
                    signature: process.env.LOGIN_SIGN,
                    expiresIn: "2d",
                })

                if (!userToken) {
                    return next(
                        new Error('token generation fail try again', {
                            cause: 400,
                        }),
                    )
                }

                await adminModel.findOneAndUpdate(
                    { token: splittedToken },
                    { token: userToken },
                    { new: true }
                )
                return res.status(201).json({ Message: "Token is refreshed", newToken: userToken })
            }
            return next(new Error("In-valid Token", { cause: 400 }))
        }

    }
}