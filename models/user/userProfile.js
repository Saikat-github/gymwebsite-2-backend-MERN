import mongoose from 'mongoose';

const Schema = mongoose.Schema;

// Constants for dropdown / enum options
const GENDERS = ['male', 'female', 'other'];
const GOALS = ['muscle building', 'weight loss', 'general fitness'];
const MEMBERSHIP_STATUS = ['active', 'inactive'];
const COMMON_CONDITIONS = ['asthma', 'diabetes', 'heart disease', 'hypertension'];

const userProfileSchema = new Schema({

    personalInfo: {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please fill a valid email address'
            ]
        },
        phone: {
            type: String,
            required: true,
            match: [/^[6-9]\d{9}$/, 'Invalid phone number'] // Indian format example
        },
        gender: {
            type: String,
            enum: GENDERS
        },
        dob: {
            type: Date,
            required: true
        },
        emergencyName: {
            type: String,
            required: true,
            trim: true
        },
        emergencyRelation: {
            type: String,
            required: true,
            trim: true
        },
        emergencyPhone: {
            type: String,
            required: true,
            match: [/^[6-9]\d{9}$/, 'Invalid phone number']
        },
        imageUrl: {
            type: String,
            required: true,
        },
        imagePublicId: {
            type: String,
            trim: true
        },
        aadharUrl: {
            type: String,
            required: true,
        },
        aadharPublicId: {
            type: String,
            trim: true
        },
    },

    healthInfo: {
        height: {
            type: Number,
            required: true,
            min: 50, // cm
            max: 300
        },
        weight: {
            type: Number,
            required: true,
            min: 20, // kg
            max: 500
        },
        goal: {
            type: String,
            enum: GOALS,
            default: 'general fitness'
        },
        hadMedicalCondition: {
            type: Boolean,
            default: false
        },
        conditions: {
            type: [String],
            default: [],
        },
        otherConditions: {
            type: String,
            trim: true
        }
    },

    membership: {
        status: {
            type: String,
            enum: MEMBERSHIP_STATUS, // ['active', 'inactive']
            default: 'inactive'
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "plan",
        },
        planType: {
            type: String,
        },
        endDate: {
            type: Date,
            default: null
        },
        lastPaymentDate: {
            type: Date,
            default: null
        },
        lastPaymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userPayment" // The Payment document that activated this membership
        }
    },

    termsAndPolicy: {
        type: Boolean,
        required: true,
        validate: {
            validator: v => v === true,
            message: 'Terms and Policy must be accepted'
        }
    },

    verified: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    userAuthId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAuth',
        default: null
    },

    rollNo: {
        type: String,
        required: true
    }

}, {
    minimize: false,
    timestamps: true
});

// Indexes (declared BEFORE model creation)
userProfileSchema.index({ userAuthId: 1 });
userProfileSchema.index({ 'personalInfo.name': 1 });
userProfileSchema.index({ 'membership.status': 1 });
userProfileSchema.index({ 'personalInfo.name': 1, 'membership.status': 1 });

const userProfileModel = mongoose.model('userProfile', userProfileSchema);

export default userProfileModel;
