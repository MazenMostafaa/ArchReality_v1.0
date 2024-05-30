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

    //=========== Delete from cloudinary ==============
    if (idCheck.profilePic.secure_url !== undefined) {

        await cloudinary.api.delete_resources_by_prefix(
            `${process.env.USERS_PROFILE_PIC_FOLDER}/profilePic/${idCheck._id}`,
        )
        await cloudinary.api.delete_folder(
            `${process.env.USERS_PROFILE_PIC_FOLDER}/profilePic/${idCheck._id}`,
        )
    }
    //=========== Delete from DB ==============
    await userModel.findByIdAndDelete(id)


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

<<<<<<< HEAD








=======
    
>>>>>>> bc89b0a9b075aa43d759184502062a2b1a4fdd21
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

export const updateProj = async (req, res, next) => {

    const { _id } = req.authAdmin

    const { title, desc, propType } = req.body

    const { projectId, assignedTo } = req.query

    const isProjectExist = await propertyModel.findById(projectId).lean()

    if (!isProjectExist) {
        return next(new Error("invalid project Id", { cause: 400 }))
    }

    if (_id.toString() !== isProjectExist.createdBy.toString()) {
        return next(new Error("Un-authorized admin to access", { cause: 400 }))
    }

    const projectCheck = await propertyModel.hydrate(isProjectExist)

    if (title) projectCheck.title = title
    if (desc) projectCheck.desc = desc
    if (propType) projectCheck.propType = propType
    if (assignedTo) {
        const engineerCheck = await userModel.findById(assignedTo)
        if (!engineerCheck || engineerCheck.role !== systemRoles.ENGINEER) {
            return next(new Error("Could not find this engineer", { cause: 400 }))
        }
        projectCheck.assignedTo = assignedTo
    }

    for (const file in req.files) {
        let imagesCounter = 0
        let Images = []
        let newImages = []
        if (file == "Images") {
            for (let index = 0; index < req.files[file].length; index++) {
                const { path } = req.files[file][index]
                const { secure_url, public_id } = await cloudinary.uploader.upload(path,
                    {
                        folder: `${process.env.PROPERTY_PICS_FOLDER}/${projectCheck.customId}`
                    }
                )
                newImages.push({ secure_url, public_id })
                imagesCounter += 1
            }
            if (imagesCounter > projectCheck.Images.length) {
                for (let index = 0; index <= imagesCounter; index++) {
                    if (index < projectCheck.Images.length) {
                        if (projectCheck.Images[index].public_id !== undefined) {
                            await cloudinary.uploader.destroy(projectCheck.Images[index].public_id)
                            projectCheck.Images.splice(projectCheck.Images[index], 1)
                        }
                    }
                }
            }
            for (let index = 0; index < projectCheck.Images.length; index++) {
                if (projectCheck.Images[index].public_id !== undefined) {
                    await cloudinary.uploader.destroy(projectCheck.Images[index].public_id)
                    projectCheck.Images.splice(projectCheck.Images[index], 1)
                    imagesCounter -= 1
                }
                if (imagesCounter == -1) {
                    break;
                }
            }
            Images = [...projectCheck.Images, ...newImages]
            projectCheck.Images = Images
        }

        let profileFlag = false
        let ARmodel
        if (file == "ARmodel") {
            for (let index = 0; index < req.files[file].length; index++) {
                const { path } = req.files[file][index]
                const { secure_url, public_id } = await cloudinary.uploader.upload(path,
                    {
                        folder: `${process.env.PROPERTY_PICS_FOLDER}/${projectCheck.customId}`
                    }
                )
                if (projectCheck.ARmodel.public_id !== undefined) {

                    await cloudinary.uploader.destroy(projectCheck.ARmodel.public_id)
                }
                ARmodel = { secure_url, public_id }
                profileFlag = true
            }
            if (profileFlag) {
                projectCheck.ARmodel = ARmodel
            }
        }
    }

    const updatedProject = await projectCheck.save()
    if (!updatedProject) {
        return next(new Error("Fail to update", { cause: 400 }))
    }
    res.status(200).json({ message: 'project has been Updated successfully', updatedProject })
}

export const deleteProj = async (req, res, next) => {
    const { _id } = req.authAdmin
    const { projectId } = req.params

    const isProjectExist = await propertyModel.findById(projectId)

    if (!isProjectExist) {
        return next(new Error("invalid project Id", { cause: 400 }))
    }

    if (_id.toString() !== isProjectExist.createdBy.toString()) {
        return next(new Error("Un-authorized admin to access", { cause: 400 }))
    }

    //=========== Delete from cloudinary ==============
    if (isProjectExist.Images.length
        || isProjectExist.ARmodel.secure_url !== undefined) {

        await cloudinary.api.delete_resources_by_prefix(
            `${process.env.PROPERTY_PICS_FOLDER}/${isProjectExist.customId}`,
        )
        await cloudinary.api.delete_folder(
            `${process.env.PROPERTY_PICS_FOLDER}/${isProjectExist.customId}`,
        )
    }
    //=========== Delete from DB ==============
    await propertyModel.findByIdAndDelete(projectId)


    res.status(200).json({ messsage: 'Deleted Done' })
}

export const listProj = async (req, res, next) => {
    const { propType } = req.query

    let ApiFeaturesInstance
    if (propType == "interior") {
        ApiFeaturesInstance = new ApiFeatures
            (propertyModel.find({ propType: { $regex: propType, $options: 'i' } }), req.query)
            .pagination()
            .select()
    }

    if (propType == "exterior") {
        ApiFeaturesInstance = new ApiFeatures
            (propertyModel.find({ propType: { $regex: propType, $options: 'i' } }), req.query)
            .pagination()
            .select()
    }
    const projects = await ApiFeaturesInstance.mongooseQuery

    res.status(200).json({ message: 'Done', projects })
}
