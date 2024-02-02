
import { userModel } from '../../../db/models/userModel.js'
import cloudinary from '../../utils/mediaCloudConfig.js'
import pkg from 'bcrypt'

export const update = async (req, res, next) => {

    const { _id } = req.authUser
    const {
        firstName,
        lastName,
        oldPassword,
        password,
        cPassword,
    } = req.body

    const isUserExist = await userModel.findById(_id).lean()

    if (!isUserExist) {
        return next(new Error("invalid user Id", { cause: 400 }))
    }
    if (!isUserExist.token) {
        return next(new Error("this user is logged out ,log in to continue process", { cause: 400 }))
    }
    const userCheck = await userModel.hydrate(isUserExist)

    if (firstName) userCheck.firstName = firstName
    if (lastName) userCheck.lastName = lastName

    if (password) {
        if (!cPassword && !oldPassword) {
            return next(new Error("must send confirm and old password", { cause: 400 }))
        }
        const isPassMatching = pkg.compareSync(oldPassword, userCheck.password)
        if (!isPassMatching) {
            return next(new Error("old password is not correct", { cause: 400 }))
        }

        if (password !== cPassword) {
            return next(new Error("confirmation password is not compatible", { cause: 400 }))
        }

        const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS)

        userCheck.password = hashedPassword
    }

    if (req.file) {

        let profileFlag = false
        let profilePic
        if (req.file.fieldname == "profile") {
            const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path,
                {
                    folder: `${process.env.USERS_PROFILE_PIC_FOLDER}/profilePic/${userCheck._id}`
                }
            )

            if (userCheck.profilePic.public_id !== undefined) {

                await cloudinary.uploader.destroy(userCheck.profilePic.public_id)
            }
            profilePic = { secure_url, public_id }
            profileFlag = true
        }

        if (profileFlag) {
            userCheck.profilePic = profilePic
        }
    }

    const updatedUser = await userCheck.save()
    if (!updatedUser) {
        return next(new Error("Fail to update", { cause: 400 }))
    }

    const { otp, isConfirmed, token, provider, role, email, ...rest } = updatedUser._doc
    res.status(200).json({ message: 'user has been Updated successfully', rest })
}