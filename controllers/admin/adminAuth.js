import passport from 'passport';
import bcrypt from 'bcrypt';
import adminAuthModel from '../../models/admin/adminAuth.js';
import { generateOTP, isValidEmail, sendAccountDeletionMail, sendOTPEmail } from '../../utils/email.js';
import axios from "axios";
import { otpModel } from '../../models/others/otpModel.js';






const sendSignupOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !isValidEmail(email)) {
            return res.json({ success: false, message: 'Valid email required' })
        }

        const existingAdmin = await adminAuthModel.findOne({ email });
        if (existingAdmin) {
            return res.json({ success: false, message: 'Admin already exists' });
        }

        //Remove any existing OTPs for this email
        const otp = generateOTP();
        await otpModel.deleteMany({ email, userType: 'admin' });

        //Create new OTP recored
        await otpModel.create({ email, otp, userType: 'admin' });

        await sendOTPEmail(email, otp)

        res.json({ success: true, message: "OTP sent to the email" })
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
        const otpRecord = await otpModel.findOne({ email, otp, userType: 'admin' });
        if (!otpRecord) {
            return res.json({ success: false, message: "Invalid OTP" });
        }
        await otpModel.findByIdAndDelete(otpRecord._id);


        //Registering new user
        const existingAdmin = await adminAuthModel.findOne({ email });
        if (existingAdmin) {
            return res.json({ message: 'Admin already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new adminAuthModel({
            email,
            password: hashedPassword,
        });

        await newAdmin.save();
        res.json({ success: true, message: "Admin added successfully"})
    } catch (error) {
        res.json({ success: false, message: 'Server error, while signing up' });
    }
}




//Login API
const adminLogin = (req, res, next) => {
    passport.authenticate('admin-local', (err, user, info) => {
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




//Logout API
const adminLogout = async (req, res) => {
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
const getAdmin = async (req, res) => {
    try {
        // Return the user data, but ensure password and sensitive info are not exposed
        const { password, ...userData } = req.user.toObject();
        return res.json({ success: true, user: userData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}




//Get all admins
const getAllAdmins = async (req, res) => {
    try {
        const admins = await adminAuthModel.find({}, '-password').sort({ createdAt: -1 }); // Exclude password field
        res.json({ success: true, admins });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}



// Forgot Password
const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await adminAuthModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Email not found' });
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
        const user = await adminAuthModel.findOne({
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



const removeAdmin = async (req, res ) => {
    try {
        const { id } = req.body;

        const adminToRemove = await adminAuthModel.findById(id);
        if (adminToRemove.userType === 'super-admin') {
            return res.json({ success: false, message: "Cannot remove super-admin" });
        }
        if (!adminToRemove) {
            return res.json({ success: false, message: "Admin not found" });
        }
        await adminAuthModel.findByIdAndDelete(id);
        res.json({ success: true, message: "Admin removed successfully"})
    } catch (error) {
        res.json({ success: false, message: error.message});
    }
}



export { sendSignupOtp, verifyAndSignupOtp, adminLogin, adminLogout, getAdmin, getAllAdmins, forgetPassword, resetPassword, removeAdmin};