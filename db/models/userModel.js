import mongoose, { Schema } from "mongoose";
import { systemRoles, providers } from '../../src/utils/systemRoles.js'

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        min: 3,
        max: 20,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        min: 3,
        max: 20,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
    },
    profilePic: {
        secure_url: String,
        public_id: String,
    },
    role: {
        type: String,
        enum: [systemRoles.CLIENT],
        default: systemRoles.CLIENT
    },
    provider: {
        type: String,
        enum: [providers.SYSTEM, providers.GOOGLE, providers.FACEBOOK],
        required: true,
        default: providers.SYSTEM
    },
    token: {
        type: String,
        default: ''
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    otp: String,

}, {
    timestamps: true
})

export const userModel = mongoose.model('user', userSchema)