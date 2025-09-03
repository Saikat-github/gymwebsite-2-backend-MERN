import express from 'express'
import { sendSignupOtp, verifyAndSignupOtp, adminLogin, adminLogout, getAdmin, forgetPassword, resetPassword, getAllAdmins, removeAdmin } from '../controllers/admin/adminAuth.js';
import { loginLimiter, sendUserOtpLimiter } from '../middlewares/rateLimit.js';
import { validateInputs } from '../middlewares/inputValidation/validateInput.js';
import { forgotPasswordValidation, resetPasswordValidation, loginValidation, registerValidation } from '../middlewares/inputValidation/userValidation.js';
import { authAdmin } from '../middlewares/authAdmin.js';
import { addPlanValidation, deletePlanValidation, memberIdValidation, updateMemberInfoValidation, updatePlanValidation } from '../middlewares/inputValidation/adminValidation.js';
import { addNewPlan, updatePlan, deletePlan, getPlans } from '../controllers/admin/adminGymInfo.js';
import { addGymSchedule, getGymSchedule, updateGymSchedule } from '../controllers/admin/adminGymSchedule.js';
import { getAllMembers, getSingleUserPayments, getAllUsers, getSingleMember, getAllPayments, getAllDayPasses, getSingleDayPass, getDashData } from '../controllers/admin/adminQueryController.js';
import { deleteMemberProfile, deleteUserAccount, markAsAvailed, sendReminder, updateMemberProfile } from '../controllers/admin/adminActionController.js';



const adminRouter = express.Router()



//Normal Passport Authentication
adminRouter.post("/signup-sendotp", authAdmin(["super_admin"]), sendUserOtpLimiter, sendSignupOtp);
adminRouter.post("/signup",authAdmin(["super_admin"]), loginLimiter, validateInputs(registerValidation), verifyAndSignupOtp);
adminRouter.post("/login", loginLimiter, validateInputs(loginValidation), adminLogin);
adminRouter.get('/logout', adminLogout);
adminRouter.get('/current_admin', authAdmin(["admin", "super_admin"]), getAdmin);
adminRouter.post('/forgot-password', sendUserOtpLimiter, validateInputs(forgotPasswordValidation), forgetPassword);
adminRouter.post('/reset-password', validateInputs(resetPasswordValidation), resetPassword);
adminRouter.get('/all-admins', authAdmin(["super_admin"]), getAllAdmins);
adminRouter.post('/remove-admin', authAdmin(["super_admin"]), removeAdmin);



//Gym Plans Management
adminRouter.get("/get-plans", getPlans);
adminRouter.post("/add-plan", authAdmin(["admin", "super_admin"]), validateInputs(addPlanValidation), addNewPlan);
adminRouter.put("/update-plan", authAdmin(["admin", "super_admin"]), validateInputs(updatePlanValidation), updatePlan);
adminRouter.post("/delete-plan", authAdmin(["admin", "super_admin"]), validateInputs(deletePlanValidation), deletePlan);



// Gym Schedule Management
adminRouter.get("/get-schedule", getGymSchedule);
adminRouter.post("/add-schedule", authAdmin(["admin", "super_admin"]), addGymSchedule);
adminRouter.post("/update-schedule", authAdmin(["admin", "super_admin"]), updateGymSchedule);



//Gym Management (Queries)
adminRouter.get("/get-dashdata", authAdmin(["admin", "super_admin"]), getDashData);
adminRouter.get("/all-users", authAdmin(["admin", "super_admin"]), getAllUsers);
adminRouter.get("/all-members", authAdmin(["admin", "super_admin"]), getAllMembers);
adminRouter.get("/get-singlemember", authAdmin(["admin", "super_admin"]), getSingleMember);
adminRouter.get("/singlemember-payments", authAdmin(["admin", "super_admin"]), getSingleUserPayments);
adminRouter.get("/all-payments", authAdmin(["admin", "super_admin"]), getAllPayments);
adminRouter.get("/all-dayPasses", authAdmin(["admin", "super_admin"]), getAllDayPasses);
adminRouter.get("/get-singledaypass", authAdmin(["admin", "super_admin"]), getSingleDayPass);




//Gym Management (Actions)
adminRouter.post("/delete-user", authAdmin(["super_admin"]), deleteUserAccount);
adminRouter.post("/delete-member", authAdmin(["super_admin"]), validateInputs(memberIdValidation), deleteMemberProfile)
adminRouter.post("/update-member", authAdmin(["super_admin"]), validateInputs(updateMemberInfoValidation), updateMemberProfile)
adminRouter.post("/send-reminder", authAdmin(["admin", "super_admin"]), validateInputs(memberIdValidation), sendReminder);
adminRouter.post("/mark-daypass-availed", authAdmin(["admin", "super_admin"]), markAsAvailed);



export default adminRouter;