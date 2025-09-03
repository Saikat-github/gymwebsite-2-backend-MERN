import passport from 'passport';
import bcrypt from 'bcrypt';
import userAuthModel from '../../models/user/userAuth.js';
import { generateOTP, isValidEmail, sendAccountDeletionMail, sendOTPEmail } from '../../utils/email.js';
import axios from "axios";
import { otpModel } from '../../models/others/otpModel.js';
import userProfileModel from '../../models/user/userProfile.js';
import { deleteFromCloudinary } from '../../config/cloudinary.js';
import userPaymentModel from '../../models/user/userPayment.js';
import mongoose from 'mongoose';
import userDayPassModel from '../../models/user/userDayPass.js';





const sendSignupOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !isValidEmail(email)) {
            return res.json({ success: false, message: 'Valid email required' })
        }

        const existingUser = await userAuthModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'User already exists, please login' });
        }

        //Remove any existing OTPs for this email
        const otp = generateOTP();
        await otpModel.deleteMany({ email, userType: 'user' });

        //Create new OTP recored
        await otpModel.create({ email, otp, userType: 'user' });

        await sendOTPEmail(email, otp)

        res.json({ success: true, message: "OTP sent to your email" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error sending OTP' });
    }
}





const verifyAndSignupOtp = async (req, res) => {
    try {
        const { email, password, otp } = req.body;
        if (!email || !password || !otp) {
            return res.json({ success: false, message: "Please fill all fields" });
        }

        //Verifying OTP
        const otpRecord = await otpModel.findOne({ email, otp, userType: 'user' });
        if (!otpRecord) {
            return res.json({ success: false, message: "Invalid OTP" });
        }
        await otpModel.findByIdAndDelete(otpRecord._id);


        //Registering new user
        const existingUser = await userAuthModel.findOne({ email });
        if (existingUser) {
            return res.json({ message: 'User already exists, please login' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userAuthModel({
            email,
            password: hashedPassword,
            profileCompleted: false
        });

        await newUser.save();

        // Auto login after registration
        req.login(newUser, (err) => {
            if (err) {
                return res.json({ success: false, message: err.message })
            }
            res.json({ success: true, message: "SignUp successful" });
        });

    } catch (error) {
        res.json({ success: false, message: 'Server error, while signing up' });
    }
}




//Login API
const userLogin = (req, res, next) => {
    passport.authenticate('user-local', (err, user, info) => {
        if (err) {
            return res.json({ success: false, message: "Internal Server Error" });
        }
        if (!user) {
            return res.json({ success: false, message: info.message });
        }

        req.login(user, (err) => {
            if (err) {
                return res.json({ success: false, message: err.message });
            }
            return res.json({ success: true, message: "Login Successful" });
        });
    })(req, res, next); // Pass req, res, next explicitly to the authenticate function
};



//Google Login API
const userGoogleLogin = async (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}`);
};




//Logout API
const userLogout = async (req, res) => {
    try {
        req.logout((err) => {
            if (err) {
                return res.json({ success: false, message: err.message });
            }
        })
        res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}



//Getting Current Doctor API
const getUser = async (req, res) => {
    try {
        // Return the user data, but ensure password and sensitive info are not exposed
        const { password, ...userData } = req.user.toObject();
        return res.json({ success: true, user: userData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}





// Forgot Password
const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userAuthModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Email not found' });
        }

        if (user.googleId) {
            return res.json({
                success: false,
                message: 'This account uses Google authentication'
            });
        }

        // Check last OTP request time
        if (user.lastOTPRequestTime && (Date.now() - user.lastOTPRequestTime < 60000)) {
            return res.json({
                success: false,
                message: 'Please wait 1 minute before requesting another OTP'
            });
        }

        const otp = generateOTP();
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpiry = new Date(Date.now() + 600000); // 10 minutes
        user.otpAttempts = 0;
        user.lastOTPRequestTime = new Date();

        await user.save();
        await sendOTPEmail(email, otp);

        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error sending OTP' });
    }
}




// Verify OTP and Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await userAuthModel.findOne({
            email,
            resetPasswordOTPExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Check attempts
        if (user.otpAttempts >= 3) {
            return res.json({
                success: false,
                message: 'Too many invalid attempts. Please request a new OTP'
            });
        }

        // Verify OTP
        if (otp !== user.resetPasswordOTP) {
            user.otpAttempts += 1;
            await user.save();
            return res.json({ success: false, message: 'Invalid OTP' });
        }


        // Reset password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpiry = undefined;
        user.otpAttempts = 0;

        await user.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error resetting password' });
    }
}





const deleteAccount = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Logout first
        await req.logout(err => {
            if (err) {
                throw new Error(err.message);
            }
        });

        const { userAuthId } = req;
        if (!userAuthId) {
            await session.abortTransaction();
            return res.json({ success: false, message: "userAuthId is required" });
        }

        const userProfileData = await userProfileModel.findOne({ userAuthId }).session(session);
        const userAuthData = await userAuthModel.findById(userAuthId).session(session);

        // If profile exists, delete Cloudinary images first
        if (userProfileData) {
            const [result1, result2] = await Promise.all([
                deleteFromCloudinary(userProfileData.personalInfo.imagePublicId),
                deleteFromCloudinary(userProfileData.personalInfo.aadharPublicId)
            ]);

            // Require BOTH images to be deleted
            if (!(result1.result === "ok" && result2.result === "ok")) {
                await session.abortTransaction();
                return res.status(500).json({ 
                    success: false, 
                    message: "Failed to delete images", 
                    result1, 
                    result2 
                });
            }

            // Delete profile + payments in transaction
            await userProfileModel.deleteOne({ _id: userProfileData._id }, { session });
            await userPaymentModel.deleteMany({ userAuthId }, { session });
            await userDayPassModel.deleteMany({ userAuthId }, { session });
        }

        // Delete auth record
        await userAuthModel.findByIdAndDelete(userAuthId, { session });

        // Commit DB changes
        await session.commitTransaction();
        session.endSession();

        // Send email after DB commit
        await sendAccountDeletionMail(userAuthData.email);

        res.status(200).json({ 
            success: true, 
            message: "Your account and profile data deleted successfully" 
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};






export {
    sendSignupOtp,
    verifyAndSignupOtp,
    userLogin,
    userGoogleLogin,
    userLogout,
    getUser,
    forgetPassword,
    resetPassword,
    deleteAccount
};

