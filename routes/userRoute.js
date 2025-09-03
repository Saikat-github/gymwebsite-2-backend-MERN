import express from 'express'
import authUser from '../middlewares/authUser.js'
import passport from 'passport'
import {
  sendSignupOtp,
  verifyAndSignupOtp,
  userLogin,
  userGoogleLogin,
  userLogout,
  getUser,
  forgetPassword,
  resetPassword,
  deleteAccount
} from '../controllers/user/userAuth.js';
import { loginLimiter, paymentRequestLimiter, sendUserOtpLimiter } from '../middlewares/rateLimit.js';
import { validateInputs } from '../middlewares/inputValidation/validateInput.js';
import { createMembershipValidation, createProfileValidation, forgotPasswordValidation, loginValidation, registerValidation, resetPasswordValidation, updateProfileValidation } from '../middlewares/inputValidation/userValidation.js';
import uploadUserFiles from '../middlewares/multer.js';
import { createUserProfile, deleteProfile, getAllDayPasses, getAllPayments, GetUserProfile, updateUserProfile } from '../controllers/user/userProfile.js';
import { createMembership, verifyMembership } from '../controllers/user/userPayment.js';



const userRouter = express.Router();


//Google Login
userRouter.get('/google', passport.authenticate('user-google', { scope: ['profile', 'email'] }));
// Google OAuth callback
userRouter.get(
  '/google/callback',
  passport.authenticate('user-google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?message=can't_use_this_account_try_login_using_email`,
  }), userGoogleLogin
);




//Normal Passport Authentication
userRouter.post("/signup-sendotp", sendUserOtpLimiter, sendSignupOtp);
userRouter.post("/signup", loginLimiter, validateInputs(registerValidation), verifyAndSignupOtp);
userRouter.post("/login", loginLimiter, validateInputs(loginValidation), userLogin);
userRouter.get('/logout', userLogout);
userRouter.get('/current_user', authUser, getUser);
userRouter.post('/forgot-password', sendUserOtpLimiter, validateInputs(forgotPasswordValidation), forgetPassword);
userRouter.post('/reset-password', validateInputs(resetPasswordValidation), resetPassword);
userRouter.delete("/delete-account", authUser, deleteAccount);



//User Profile Routes
userRouter.post("/create-profile",
  uploadUserFiles,
  authUser,
  validateInputs(createProfileValidation),
  createUserProfile
);
userRouter.post("/update-profile",
  uploadUserFiles,
  authUser,
  validateInputs(updateProfileValidation),
  updateUserProfile
);
userRouter.get("/get-profile", authUser, GetUserProfile);
userRouter.delete("/delete-profile", authUser, deleteProfile);
userRouter.get("/get-allpayments", authUser, getAllPayments);
userRouter.get("/get-daypasses", authUser, getAllDayPasses);


//Payment Routes
userRouter.post("/create-order", paymentRequestLimiter, authUser, validateInputs(createMembershipValidation), createMembership);
userRouter.post("/verify-order", authUser, verifyMembership);



export default userRouter;