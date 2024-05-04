import mongoose, { Schema } from "mongoose";
import { systemRoles } from '../../src/utils/systemRoles.js'

const adminSchema = new Schema({
    firstName: {
        type: String,
        // required: true,
        min: 3,
        max: 20,
        trim: true
    },
    lastName: {
        type: String,
        // required: true,
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
        enum: [systemRoles.ADMIN],
        default: systemRoles.ADMIN
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

export const adminModel = mongoose.model('admin', adminSchema)