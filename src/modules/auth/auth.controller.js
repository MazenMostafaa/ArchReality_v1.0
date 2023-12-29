import { userModel } from '../../../db/models/userModel.js'
import { generateToken, verifyToken } from '../../utils/tokenFunctions.js'
import { sendEmailService } from '../../services/mailService.js'
import pkg from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'
import { providers, systemRoles } from '../../utils/systemRoles.js'
import { customAlphabet, nanoid } from 'nanoid'
import { OTPemailTemplate } from '../../utils/OTPemailTemplate.js'


export const register = async (req, res, next) => {
    const {
        firstName,
        lastName,
        email,
        password,
        cPassword,
        role
    } = req.body

    const isEmailDuplicate = await userModel.findOne({ email })
    if (isEmailDuplicate) {
        return next(new Error('email is already exist', { cause: 400 }))
    }

    if (password !== cPassword) {
        return next(new Error("password and cPassword don't match", { cause: 400 }))
    }

    // Generate Token
    const token = generateToken({
        payload: { email },
        signature: process.env.SIGNUP_CONFIRMATION_EMAIL_TOKEN,
        expiresIn: '2d',
    })

    // generate email

    // Generate Confirmation Link
    const conirmationlink = `${req.protocol}://${req.headers.host}/api/auth/confirmEmail/${token}`
    const isEmailSent = sendEmailService({
        to: email,
        subject: 'Confirmation Email',
        message: `<a href=${conirmationlink}>Click here to confirm </a>`,
    })

    if (!isEmailSent) {
        return next(new Error('fail to sent confirmation email , try fetch API again.', { cause: 400 }))
    }
    // hash password
    const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS)

    // Initialize user object
    const user = new userModel({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role ? role : systemRoles.CLIENT,
        provider: providers.SYSTEM
    })

    // save Query
    await user.save()

    res.status(201)
        .json({
            message: "Please direct user to confirm his/her inbox to continue registeration,confirmation will expire in 2 day",
            cofirmationEmail_API: conirmationlink
        })
}

export const confirmEmail = async (req, res, next) => {

    const { token } = req.params
    const tokenData = verifyToken({
        token,
        signature: process.env.SIGNUP_CONFIRMATION_EMAIL_TOKEN
    })

    if (!tokenData) {
        return next(new Error('Too late to confirm, token is expired. register again', { cause: 400 }))
    }
    const user = await userModel.findOneAndUpdate(
        { email: tokenData?.email, isConfirmed: false },
        { isConfirmed: true },
        { new: true },
    )
    if (!user) {
        return next(new Error('this email is already confirmed', { cause: 400 }))
    }
    res.status(200).json({ messge: 'Confirmed done, please try to login' })
}

export const login = async (req, res, next) => {
    const { password, email } = req.body

    const user = await userModel.findOne({ email, isConfirmed: true })

    if (!user) {
        return next(new Error("It seems like invalid credentials OR you didn't confirm your email", { cause: 400 }))
    }

    const isPasswordMatch = pkg.compareSync(password, user.password)
    if (!isPasswordMatch) {
        return next(new Error('invalid login credentials', { cause: 400 }))
    }

    //  generate Login token
    const token = generateToken({
        payload: {
            _id: user._id,
            email: user.email,
            role: user.role
        },
        signature: process.env.LOGIN_SIGN,
        expiresIn: '5d'
    })

    const logedInUser = await userModel.findOneAndUpdate(
        { email },
        { token },
        { new: true }
    )


    res.status(200).json({
        Message: "User loged in",
        userName: `${logedInUser.firstName} ${logedInUser.lastName}`,
        userRole: logedInUser.role,
        userToken: logedInUser.token
    })
}

export const loginWithGmail = async (req, res, next) => {
    const client = new OAuth2Client()
    const { idToken } = req.body
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.CLIENT_ID,
        })
        const payload = ticket.getPayload()
        return payload
    }
    const { email_verified, email, given_name, family_name, name } = await verify()
    if (!email_verified) {
        return next(new Error('invalid email', { cause: 400 }))
    }
    const user = await userModel.findOne({ email, provider: providers.GOOGLE })
    //login
    if (user) {
        const token = generateToken({
            payload: {
                _id: user._id,
                email: user.email,
                role: user.role
            },
            signature: process.env.LOGIN_SIGN,
            expiresIn: '5d'
        })

        const userUpdated = await userModel.findOneAndUpdate(
            { email },
            {
                token,
            },
            {
                new: true,
            },
        )

        res.status(200).json({
            message: 'user loged in',
            userName: name, userRole: userUpdated.role, userToken: token
        })
    }

    // signUp
    const userObject = {
        firstName: given_name,
        lastName: family_name,
        email,
        password: pkg.hashSync(nanoid(6), +process.env.SALT_ROUNDS),
        provider: providers.GOOGLE,
        isConfirmed: true,
        role: systemRoles.CLIENT,
    }
    const newUser = await userModel.create(userObject)
    const token = generateToken({
        payload: {
            _id: newUser._id,
            email: newUser.email,
            role: newUser.role
        },
        signature: process.env.LOGIN_SIGN,
        expiresIn: '5d'
    })
    newUser.token = token
    await newUser.save()
    res.status(200).json({
        message: 'Verified and user loged in',
        userName: name, userRole: newUser.role, userToken: token
    })
}

export const forgetPassword = async (req, res, next) => {
    const { email } = req.body
    const user = await userModel.findOne({ email })
    if (!user) {
        return next(new Error('invalid email', { cause: 400 }))
    }

    const randomOTP = customAlphabet('1234567890', 4)
    const otp = randomOTP()

    // const token = generateToken({
    //     payload: {
    //         email,
    //         otp,
    //     },
    //     signature: process.env.FORGET_PASS_TOKEN,
    //     expiresIn: '1h',
    // })

    // const checkOTP = `${req.protocol}://${req.headers.host}/api/auth/checkOTP/${token}`

    const isEmailSent = sendEmailService({
        to: email,
        subject: 'OTP verification',
        message: OTPemailTemplate({ otp }),

    })
    if (!isEmailSent) {
        return next(new Error('fail to sent reset password email', { cause: 400 }))
    }

    const userUpdates = await userModel.findOneAndUpdate(
        { email },
        {
            otp,
        },
        {
            new: true,
        },
    )
    if (!userUpdates) {
        return next(
            new Error('changing password process is failed ,try to fetch an API again', { cause: 400 }))
    }
    res.status(200).json({
        message: 'OTP verification code is sent check your email',
        checkOTP_API: checkOTP
    })
}

export const checkOTP = async (req, res, next) => {
    const { otp, email } = req.body

    const user = await userModel.findOne({ email, otp })
    if (!user) {
        return next(
            new Error('In-valid user', { cause: 400 })
        )
    }

    if (user.otp !== otp) {
        return next(
            new Error('In-valid OTP code', { cause: 400 })
        )
    }

    res.status(200).json({ message: 'OTP is correct' })
}

export const resetPassword = async (req, res, next) => {
    const { email, password, cPassword } = req.body

    const user = await userModel.findOne({ email })
    if (!user) {
        return next(
            new Error('In-valid user', { cause: 400 })
        )
    }

    if (!password || !cPassword) {
        return next(
            new Error('must supply with password and confirm password', { cause: 400 }))
    }
    if (password !== cPassword) {
        return next(new Error("password and cPassword don't match", { cause: 400 }))
    }

    const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS)

    user.password = hashedPassword
    user.otp = null

    const resetedPassData = await user.save()
    if (!resetedPassData) {
        return next(
            new Error('changing password process is failed,try to fetch an API again', { cause: 400 }))
    }
    res.status(200).json({ message: 'password has been updated successfully' })
}

export const logout = async (req, res, next) => {

    const { email } = req.body

    const userCheck = await userModel.findOne({ email })

    if (!userCheck) {
        return next(
            new Error('in-valid email', { cause: 400 })
        )
    }

    const userLogedOut = await userModel.findOneAndUpdate({ email }, { token: "" })
    if (!userLogedOut) {
        return next(
            new Error('fail to update the user', { cause: 400 })
        )
    }
    res.status(200).json({ Message: " user logged out" })
}