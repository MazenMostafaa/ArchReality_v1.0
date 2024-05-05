import { adminModel } from '../../../db/models/adminModel.js'
import { propertyModel } from '../../../db/models/propertyModel.js'
import { generateToken, verifyToken } from '../../utils/tokenFunctions.js'
import { sendEmailService } from '../../services/mailService.js'
import pkg from 'bcrypt'
import { systemRoles } from '../../utils/systemRoles.js'
import cloudinary from '../../utils/mediaCloudConfig.js'
import { userModel } from '../../../db/models/userModel.js'
import { ApiFeatures } from '../../utils/apiFeatures.js'
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('123456_=!ascbhdtel', 5)
// import { customAlphabet, nanoid } from 'nanoid'
// import { OTPemailTemplate } from '../../utils/OTPemailTemplate.js'

export const mainAccount = async (req, res, next) => {
    const {
        email,
        password,
    } = req.body


    // Generate Token
    const token = generateToken({
        payload: { email },
        signature: process.env.LOGIN_SIGN,
        expiresIn: '50d'

    })

    // hash password
    const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS)

    // Initialize admin object
    const admin = new adminModel({
        firstName: 'sara',
        lastName: 'ali',
        email,
        token,
        password: hashedPassword,
        role: systemRoles.ADMIN,
        isConfirmed: true
    })

    // save Query
    await admin.save()

    res.status(201)
        .json({
            message: "Admin is successfully created "
        })
}

export const createAdmin = async (req, res, next) => {
    const {
        email,
        password,
        role
    } = req.body

    if (role == systemRoles.CLIENT) {
        return next(new Error('Unauthorized to create a client account', { cause: 400 }))
    }

    // ==> ADMIN
    if (role == systemRoles.ADMIN) {
        const wrongEmail = await userModel.findOne({ email })

        if (wrongEmail) {
            return next(new Error("could not create an admin account by this email", { cause: 400 }))
        }

        const isEmailDuplicate = await adminModel.findOne({ email })

        if (isEmailDuplicate) {
            return next(new Error('email is already exist', { cause: 400 }))
        }

        // Generate Token
        const token = generateToken({
            payload: { email },
            signature: process.env.SIGNUP_CONFIRMATION_EMAIL_TOKEN,
            expiresIn: '2d'

        })

        // generate email

        // Generate Confirmation Link
        const conirmationlink = `${req.protocol}://${req.headers.host}/api/dashboard/confirmEmail/${token}`
        const isEmailSent = sendEmailService({
            to: email,
            subject: 'Confirmation Email',
            message: `<h3>Your account's credentioal</h3>
                        <p><b>Email:</b> ${email}</p>
                        <p><b>Password:</b> ${password}</p>
            <a href=${conirmationlink}>Click here to confirm </a>`,
        })

        if (!isEmailSent) {
            return next(new Error('fail to sent confirmation email , try fetch API again.', { cause: 400 }))
        }
        // hash password
        const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS)

        // Initialize admin object
        const admin = new adminModel({
            firstName: '',
            lastName: '',
            email,
            password: hashedPassword,
            role: systemRoles.ADMIN,
        })

        // save Query
        await admin.save()

        res.status(201)
            .json({
                message: "Admin is successfully created just confirm the account",
                cofirmationEmail_API: conirmationlink
            })

        // ==> ENGINEER
    }
    // ==> ENGINEER
    else {
        const wrongEmail = await adminModel.findOne({ email })
        if (wrongEmail) {
            return next(new Error("could not create an engineer account by this email", { cause: 400 }))
        }

        const isEmailDuplicate = await userModel.findOne({ email })
        if (isEmailDuplicate) {
            return next(new Error('email is already exist', { cause: 400 }))
        }

        // Generate Token
        const token = generateToken({
            payload: { email },
            signature: process.env.SIGNUP_CONFIRMATION_EMAIL_TOKEN,
            expiresIn: '2d'

        })
        // generate email

        // Generate Confirmation Link
        const conirmationlink = `${req.protocol}://${req.headers.host}/api/auth/confirmEmail/${token}`
        const isEmailSent = sendEmailService({
            to: email,
            subject: 'Confirmation Email',
            message: `<h3>Your account's credentioal</h3>
                    <p><b>Email:</b> ${email}</p>
                    <p><b>Password:</b> ${password}</p>
        <a href=${conirmationlink}>Click here to confirm </a>`,
        })

        if (!isEmailSent) {
            return next(new Error('fail to sent confirmation email , try fetch API again.', { cause: 400 }))
        }
        // hash password
        const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS)

        // Initialize Engineer object
        const engineer = new userModel({
            firstName: '',
            lastName: '',
            email,
            password: hashedPassword,
            role: systemRoles.ENGINEER,
        })

        // save Query
        await engineer.save()

        res.status(201)
            .json({
                message: "Engineer is successfully created just confirm the account",
                cofirmationEmail_API: conirmationlink
            })
    }
}

export const updateAdmin = async (req, res, next) => {

    const { _id } = req.authAdmin
    const {
        firstName,
        lastName,
        oldPassword,
        password,
        cPassword,
    } = req.body

    const isAdminExist = await adminModel.findById(_id).lean()

    if (!isAdminExist) {
        return next(new Error("invalid admin Id", { cause: 400 }))
    }
    if (!isAdminExist.token) {
        return next(new Error("this admin is logged out ,log in to continue process", { cause: 400 }))
    }
    const adminCheck = await adminModel.hydrate(isAdminExist)

    if (firstName) adminCheck.firstName = firstName
    if (lastName) adminCheck.lastName = lastName

    if (password) {
        if (!cPassword && !oldPassword) {
            return next(new Error("must send confirm and old password", { cause: 400 }))
        }
        const isPassMatching = pkg.compareSync(oldPassword, adminCheck.password)
        if (!isPassMatching) {
            return next(new Error("old password is not correct", { cause: 400 }))
        }

        if (password !== cPassword) {
            return next(new Error("confirmation password is not compatible", { cause: 400 }))
        }

        const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS)

        adminCheck.password = hashedPassword
    }

    if (req.file) {

        let profileFlag = false
        let profilePic
        if (req.file.fieldname == "profile") {
            const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path,
                {
                    folder: `${process.env.ADMINS_PROFILE_PIC_FOLDER}/profilePic/${adminCheck._id}`
                }
            )

            if (adminCheck.profilePic.public_id !== undefined) {

                await cloudinary.uploader.destroy(adminCheck.profilePic.public_id)
            }
            profilePic = { secure_url, public_id }
            profileFlag = true
        }

        if (profileFlag) {
            adminCheck.profilePic = profilePic
        }
    }

    const updatedAdmin = await adminCheck.save()
    if (!updatedAdmin) {
        return next(new Error("Fail to update", { cause: 400 }))
    }

    const { otp, isConfirmed, token, email, ...rest } = updatedAdmin._doc
    res.status(200).json({ message: 'admin has been Updated successfully', rest })
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
    const admin = await adminModel.findOneAndUpdate(
        { email: tokenData?.email, isConfirmed: false },
        { isConfirmed: true },
        { new: true },
    )
    if (!admin) {
        return next(new Error('this email is already confirmed', { cause: 400 }))
    }
    res.status(200).json({ messge: 'Confirmed done, please try to login' })
}

export const login = async (req, res, next) => {
    const { password, email } = req.body

    const admin = await adminModel.findOne({ email, isConfirmed: true })

    if (!admin) {
        return next(new Error("It seems like invalid credentials OR you didn't confirm your email", { cause: 400 }))
    }

    const isPasswordMatch = pkg.compareSync(password, admin.password)
    if (!isPasswordMatch) {
        return next(new Error('invalid login credentials', { cause: 400 }))
    }

    //  generate Login token
    const token = generateToken({
        payload: { email: admin.email },
        signature: process.env.LOGIN_SIGN,
        expiresIn: '100d'
    })

    const logedInadmin = await adminModel.findOneAndUpdate(
        { email },
        { token },
        { new: true }
    )


    if (logedInadmin.profilePic.secure_url !== undefined) {

        const { secure_url } = logedInadmin.profilePic
        return res.status(200).json({
            Message: "admin loged in",
            firstName: logedInadmin.firstName,
            lastName: logedInadmin.lastName,
            picture: secure_url,
            email: logedInadmin.email,
            adminRole: logedInadmin.role,
            adminToken: logedInadmin.token
        })
    }

    res.status(200).json({
        Message: "admin loged in",
        firstName: logedInadmin.firstName,
        lastName: logedInadmin.lastName,
        email: logedInadmin.email,
        adminRole: logedInadmin.role,
        adminToken: logedInadmin.token
    })
}

export const deleteAcc = async (req, res, next) => {
    // const { _id } = req.authAdmin
    const { id } = req.params

    const adminProbability = await adminModel.findById(id)
    if (adminProbability) {
        return next(new Error('Sorry! you can not delete another admin account', { cause: 400 }))
    }

    const idCheck = await userModel.findById(id)
    if (!idCheck) {
        return next(new Error('could not find this account', { cause: 400 }))
    }

    //=========== Delete from DB ==============
    await userModel.findByIdAndDelete(id)

    //=========== Delete from cloudinary ==============
    await cloudinary.api.delete_resources_by_prefix(
        `${process.env.USERS_PROFILE_PIC_FOLDER}/profilePic/${idCheck._id}`,
    )
    await cloudinary.api.delete_folder(
        `${process.env.USERS_PROFILE_PIC_FOLDER}/profilePic/${idCheck._id}`,
    )

    res.status(200).json({ messsage: 'Deleted Done' })
}

export const listAccounts = async (req, res, next) => {
    const { role } = req.query

    let ApiFeaturesInstance
    if (role == "admin") {
        ApiFeaturesInstance = new ApiFeatures
            (adminModel.find({ role: { $regex: role, $options: 'i' } }), req.query)
            .pagination()
            .select()
    }

    if (role == "engineer" || "client") {
        ApiFeaturesInstance = new ApiFeatures
            (userModel.find({ role: { $regex: role, $options: 'i' } }), req.query)
            .pagination()
            .select()
    }
    const accounts = await ApiFeaturesInstance.mongooseQuery

    res.status(200).json({ message: 'Done', accounts })
}

export const addProj = async (req, res, next) => {
    const { _id } = req.authAdmin

    const { title, desc, propType } = req.body

    const { createdBy, assignedTo } = req.query

    // check Admin's ID
    if (_id.toString() !== createdBy.toString()) {
        return next(new Error('incorrect admin ID', { cause: 400 }))
    }

    // check Engineer's ID if exists
    if (assignedTo) {

        const engineerCheck = await userModel.findById(assignedTo)
        if (!engineerCheck) {
            return next(new Error('Could not found this Engineer', { cause: 400 }))
        }
        if (engineerCheck.role == systemRoles.CLIENT) {
            return next(new Error('incorrect Engineer ID', { cause: 400 }))
        }
    }

    if (Object.keys(req.files)) {
        return next(new Error('please upload pictures', { cause: 400 }))
    }
    const customId = nanoid()
    let Images = []
    let ARmodel

    for (const file in req.files) {
        if (file == "Images") {
            for (let index = 0; index < req.files[file].length; index++) {
                const { path } = req.files[file][index]
                const { secure_url, public_id } = await cloudinary.uploader.upload(path,
                    {
                        folder: `${process.env.PROPERTY_PICS_FOLDER}/${customId}`
                    }
                )
                Images.push({ secure_url, public_id })
            }
        }
        if (file == "ARmodel") {
            for (let index = 0; index < req.files[file].length; index++) {
                const { path } = req.files[file][index]
                const { secure_url, public_id } = await cloudinary.uploader.upload(path,
                    {
                        folder: `${process.env.PROPERTY_PICS_FOLDER}/${customId}`
                    }
                )
                ARmodel = { secure_url, public_id }
            }
            // for (const key of req.files[file]) {

            //     const { secure_url, public_id } = await cloudinary.uploader.upload(key.path,
            //         {
            //             folder: `${process.env.PROPERTY_PICS_FOLDER}/${customId}`,
            //         }
            //     )
            //     ARmodel = { secure_url, public_id }
            // }
        }
    }

    const propertObject = {
        title,
        desc,
        propType,
        Images,
        ARmodel,
        assignedTo: assignedTo ? assignedTo : null,
        customId,
        createdBy: _id
    }


    const project = await propertyModel.create(propertObject)

    res.status(200).json({ message: 'Done', project })
}
