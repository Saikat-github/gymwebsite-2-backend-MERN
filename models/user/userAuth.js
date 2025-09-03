import mongoose from "mongoose";
import bcrypt from "bcrypt";

const Schema = mongoose.Schema;

const userAuthSchema = new Schema({
    userType: {
        type: String,
        default: 'user'
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
        required: function () {
            return !this.googleId; // Password required only for local auth
        }
    },
    name: String,
    googleId: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    profileCompleted: Boolean,
    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resetPasswordOTP: String,
    resetPasswordOTPExpiry: Date,
    otpAttempts: { type: Number, default: 0 },
    lastOTPRequestTime: Date
},
    {
        minimize: false,
        timestamps: true
    });


// Validation: Ensure at least one authentication method (password or googleId)
userAuthSchema.pre("save", function (next) {
    if (!this.password && !this.googleId) {
        return next(new Error("Either password or Google ID must be provided."));
    }
    next();
});


const userAuthModel = mongoose.models.userAuth || mongoose.model('userAuth', userAuthSchema);

export default userAuthModel;