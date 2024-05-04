import { Schema, model } from 'mongoose'

const propertySchema = new Schema({

    title: {
        type: String,
        required: true,
        lowercase: true,
    },
    desc: String,
    propType: {
        type: String,
        enum: ['exterior', 'interior'],
        required: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'user',
    },
    Images: [
        {
            secure_url: {
                type: String,
                required: true,
            },
            public_id: {
                type: String,
                required: true,
            },
        },
    ],
    ARmodel: {
        secure_url: String,
        public_id: String,
    },
    customId: String,
}, {
    timestamps: true
})


export const propertyModel = model('property', propertySchema)