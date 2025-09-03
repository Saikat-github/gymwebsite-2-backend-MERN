import userAuthModel from "../../models/user/userAuth.js";
import { sendAccountDeletionMail, sendProfileDeletionMail, sendReminderEmail, sendSubscriptionExpiredEmail } from '../../utils/email.js';
import userProfileModel from '../../models/user/userProfile.js';
import { deleteFromCloudinary } from '../../config/cloudinary.js';
import userPaymentModel from '../../models/user/userPayment.js';
import mongoose from 'mongoose';
import userDayPassModel from '../../models/user/userDayPass.js';






const deleteUserAccount = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { userAuthId } = req.body;
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
            message: "Account and profile data deleted successfully"
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};





// Delete member Profile
const deleteMemberProfile = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { memberId } = req.body;

        // 1️⃣ Find profile
        const userProfileData = await userProfileModel.findById(memberId).session(session);
        if (!userProfileData) {
            await session.abortTransaction();
            return res.json({ success: false, message: "User profile not found" });
        }

        // 2️⃣ Delete images from Cloudinary (in parallel)
        const [result1, result2] = await Promise.all([
            deleteFromCloudinary(userProfileData.personalInfo.imagePublicId),
            deleteFromCloudinary(userProfileData.personalInfo.aadharPublicId)
        ]);

        // 3️⃣ Ensure BOTH images deleted successfully
        if (!(result1.result === "ok" && result2.result === "ok")) {
            await session.abortTransaction();
            return res.json({
                success: false,
                message: "Failed to delete images",
                result1,
                result2
            });
        }

        // 4️⃣ Delete profile + payments + update auth in one transaction
        await userProfileModel.findByIdAndDelete(memberId, { session });
        await userPaymentModel.deleteMany({ userAuthId: userProfileData.userAuthId }, { session });
        await userDayPassModel.deleteMany({ userAuthId: userProfileData.userAuthId }, { session });
        await userAuthModel.findByIdAndUpdate(
            userProfileData.userAuthId,
            { profileCompleted: false, profileId: null },
            { session }
        );

        // 5️⃣ Commit transaction
        await session.commitTransaction();
        session.endSession();

        // 6️⃣ Send deletion email outside transaction
        await sendProfileDeletionMail(
            userProfileData.personalInfo.email,
            userProfileData.personalInfo.name
        );

        return res.json({ success: true, message: "Profile Deleted" });

    } catch (error) {
        // Rollback on any error
        await session.abortTransaction();
        session.endSession();
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};





//Update member
const updateMemberProfile = async (req, res) => {
    try {
        const { memberId, verified, noOfDays } = req.body;

        // Convert noOfDays to number
        const daysToAdd = parseInt(noOfDays, 10) || 0;

        const userProfile = await userProfileModel.findById(memberId)
        if (!userProfile) {
            return res.json({ success: false, message: "User profile not found" });
        }

        const now = new Date();
        let endDate = new Date(now);

        if (userProfile.membership?.status === "active" && userProfile.membership.endDate) {
            endDate = new Date(userProfile.membership.endDate);
            endDate.setDate(endDate.getDate() + daysToAdd); // Now using number

            await userProfileModel.findByIdAndUpdate(
                memberId,
                {
                    $set: {
                        "membership.endDate": endDate,
                        verified
                    },
                },
                { new: true, runValidators: true }
            );
            res.json({ success: true, message: "Member details updated" });
        } else {
            return res.json({ success: false, message: "Membership is not active" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}




//Send reminder email
const sendReminder = async (req, res) => {
    try {
        const { memberId } = req.body;
        const userProfile = await userProfileModel.findById(memberId)
        if (!userProfile) {
            return res.json({ success: false, message: "User profile not found" });
        }

        if (userProfile.membership?.status !== "active" || !userProfile.membership.endDate) {
            await sendSubscriptionExpiredEmail(userProfile.personalInfo.email, userProfile.personalInfo.name, userProfile.membership.endDate);
        } else {
            await sendReminderEmail(userProfile.personalInfo.email, userProfile.personalInfo.name, userProfile.membership.endDate);
        }

        res.json({ success: true, message: "Reminder sent successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}




//Mark day pass as availed
const markAsAvailed = async (req, res) => {
    try {
        const { dayPassId } = req.body;
        if (!dayPassId) {
            return res.json({ success: false, message: "dayPassId is required" });
        }

        await userDayPassModel.findByIdAndUpdate(dayPassId, { availed: true })
        res.json({ success: true, message: "Day pass has been mark as availed" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}



export { deleteUserAccount, deleteMemberProfile, updateMemberProfile, sendReminder, markAsAvailed };