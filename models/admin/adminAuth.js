import mongoose from "mongoose";


const Schema = mongoose.Schema;

const adminAuthSchema = new Schema({
    userType: {
        type: String,
        enum: ["admin", "super_admin"],
        default: 'admin'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        minlength: [8, 'Password must be at least 8 characters long'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordOTP: String,
    resetPasswordOTPExpiry: Date,
    otpAttempts: { type: Number, default: 0 },
    lastOTPRequestTime: Date
}, {
    minimize: false,
    timestamps: true
});




const adminAuthModel = mongoose.models.adminAuth || mongoose.model('adminAuth', adminAuthSchema);

export default adminAuthModel;