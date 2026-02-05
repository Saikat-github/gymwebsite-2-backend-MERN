import mongoose from "mongoose";
import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary.js";
import { sendProfileDeletionMail } from "../../utils/email.js";
import { applyPagination, applyPaginationForDayPasses } from "../../utils/applyPagination.js";
import { generateSerialNumber } from "../../utils/generateSerialNumber.js";
import userProfileModel from "../../models/user/userProfile.js";
import userAuthModel from "../../models/user/userAuth.js";
import userDayPassModel from "../../models/user/userDayPass.js";
import userPaymentModel from "../../models/user/userPayment.js";



//API to add user profile
const createUserProfile = async (req, res) => {
    try {
        const { files, body } = req;

        // File validation (express-validator can't do this)
        if (!files?.image?.[0] || !files?.aadhar?.[0]) {
            return res.json({
                success: false,
                message: "Both image and Aadhar document are required"
            });
        }


        // Helper function to upload files to Cloudinary
        const uploadFile = async (fileBuffer, folderPath) => {
            try {
                const result = await uploadToCloudinary(fileBuffer, folderPath);
                return { url: result.secure_url, public_id: result.public_id };
            } catch (error) {
                throw new Error(`Failed to upload to ${folderPath}: ${error.message}`);
            }
        };

        // Upload files to Cloudinary
        const [imageRes, aadharRes] = await Promise.all([
            uploadFile(files.image[0].buffer, 'gymMembers/image'),
            uploadFile(files.aadhar[0].buffer, 'gymMembers/aadhar')
        ]);



        // Ensure email is provided
        if (!body.email) {
            return res.json({ success: false, message: "Email is required" });
        }

        // Check if a user with the same email already exists
        const existingUserProfile = await userProfileModel.findOne({ userAuthId: req.userAuthId });
        if (existingUserProfile) {
            return res.json({ success: false, message: "profile is already created" });
        }


        const rollNumber = await generateSerialNumber("GYM");



        // Create user profile record
        const newUserProfile = new userProfileModel({
            personalInfo: {
                name: body.name,
                email: body.email,
                phone: body.phone,
                gender: body.gender,
                dob: body.dob,
                emergencyName: body.emergencyName,
                emergencyPhone: body.emergencyPhone,
                emergencyRelation: body.emergencyRelation,
                imageUrl: imageRes.url,
                imagePublicId: imageRes.public_id,
                aadharUrl: aadharRes.url,
                aadharPublicId: aadharRes.public_id,
            },
            healthInfo: {
                height: body.height,
                weight: body.weight,
                goal: body.goal,
                hadMedicalCondition: body.hadMedicalCondition,
                conditions: body.conditions,
                otherConditions: body.otherConditions
            },
            termsAndPolicy: body.termsAndPolicy,
            userAuthId: req.userAuthId,
            rollNo: rollNumber
        });

        await newUserProfile.save();
        await userAuthModel.findByIdAndUpdate(req.userAuthId, { profileCompleted: true, profileId: newUserProfile._id });

        res.json({
            success: true,
            message: 'Profile added successfully',
        });

    } catch (error) {
        console.error('Profile creation error:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};





//API to get user profile for user panel
const GetUserProfile = async (req, res) => {
    try {
        const { userAuthId } = req;
        const profileData = await userProfileModel.findOne({ userAuthId });

        res.json({ success: true, data: profileData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}




//API to update user profile for user panel
const updateUserProfile = async (req, res) => {
    try {
        const { files, body, userAuthId } = req;
        const existingUser = await userProfileModel.findOne({ userAuthId });

        if (!existingUser) {
            return res.json({ success: false, message: "User not found" });
        }

        // Helper function to upload files to Cloudinary
        const uploadFile = async (fileBuffer, folderPath) => {
            try {
                const result = await uploadToCloudinary(fileBuffer, folderPath);
                return { url: result.secure_url, public_id: result.public_id };
            } catch (error) {
                throw new Error(`Failed to upload to ${folderPath}: ${error.message}`);
            }
        };

        // Build update object dynamically
        const updateFields = {};

        // Handle image upload
        if (files.image && files.image[0]) {
            const imageRes = await uploadFile(files.image[0].buffer, 'gymMembers/image');
            updateFields['personalInfo.imageUrl'] = imageRes.url;
            updateFields['personalInfo.imagePublicId'] = imageRes.public_id;
        }

        // Handle aadhar upload
        if (files.aadhar && files.aadhar[0]) {
            const aadharRes = await uploadFile(files.aadhar[0].buffer, 'gymMembers/aadhar');
            updateFields['personalInfo.aadharUrl'] = aadharRes.url;
            updateFields['personalInfo.aadharPublicId'] = aadharRes.public_id;
        }

        // Update personal info fields only if provided
        if (body.name) updateFields['personalInfo.name'] = body.name;
        if (body.email) updateFields['personalInfo.email'] = body.email;
        if (body.phone) updateFields['personalInfo.phone'] = body.phone;
        if (body.gender) updateFields['personalInfo.gender'] = body.gender;
        if (body.dob) updateFields['personalInfo.dob'] = body.dob;
        if (body.emergencyName) updateFields['personalInfo.emergencyName'] = body.emergencyName;
        if (body.emergencyPhone) updateFields['personalInfo.emergencyPhone'] = body.emergencyPhone;
        if (body.emergencyRelation) updateFields['personalInfo.emergencyRelation'] = body.emergencyRelation;

        // Update health info fields only if provided
        if (body.height) updateFields['healthInfo.height'] = body.height;
        if (body.weight) updateFields['healthInfo.weight'] = body.weight;
        if (body.goal) updateFields['healthInfo.goal'] = body.goal;
        if (body.hadMedicalCondition !== undefined) updateFields['healthInfo.hadMedicalCondition'] = body.hadMedicalCondition;
        if (body.conditions) updateFields['healthInfo.conditions'] = body.conditions;
        if (body.otherConditions) updateFields['healthInfo.otherConditions'] = body.otherConditions;

        // Update root level fields
        if (body.termsAndPolicy !== undefined) updateFields['termsAndPolicy'] = body.termsAndPolicy;
        if (body.rollNo) updateFields['rollNo'] = body.rollNo;

        // Perform update with $set
        const updatedUserProfile = await userProfileModel.findByIdAndUpdate(
            existingUser._id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}





// Delete Doctor Profile
const deleteProfile = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userAuthId } = req;

        // 1️⃣ Find profile
        const userProfileData = await userProfileModel.findOne({ userAuthId }).session(session);
        if (!userProfileData) {
            await session.abortTransaction();
            session.endSession();
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
            session.endSession();
            return res.json({ 
                success: false, 
                message: "Failed to delete images", 
                result1, 
                result2 
            });
        }

        // 4️⃣ Delete profile + payments + update auth in one transaction
        await userProfileModel.deleteOne({ _id: userProfileData._id }).session(session);
        await userPaymentModel.deleteMany({ userAuthId }).session(session);
        await userDayPassModel.deleteMany({ userAuthId }).session(session);
        await userAuthModel.findByIdAndUpdate(
            userAuthId, 
            { $set:{ profileCompleted: false, profileId: null }}
        ).session(session);

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





//Get all payments for an user
const getAllPayments = async (req, res) => {
    try {
        const { cursor } = req.query;
        const { userAuthId } = req;

        const user = await userAuthModel.findById(userAuthId);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found!"
            })
        }

        let query = { userAuthId, paymentStatus: { $ne: "created" } };

        const { results, hasNextPage, nextCursor } = await applyPagination(query, userPaymentModel, cursor)

        if (results.length === 0) {
            return res.json({
                success: false,
                message: "No payment details found!"
            })
        }


        res.json({
            success: true,
            data: results,
            hasNextPage,
            nextCursor
        })

    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}



const getAllDayPasses = async (req, res) => {
    try {
        const { cursor } = req.query;
        const { userAuthId } = req;

        const user = await userAuthModel.findById(userAuthId);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found!"
            })
        }

        let query = { userAuthId, paymentStatus: { $ne: "created" } };

        const { results, hasNextPage, nextCursor } = await applyPaginationForDayPasses(query, userDayPassModel, cursor)

        if (results.length === 0) {
            return res.json({
                success: false,
                message: "No payment details found!"
            })
        }


        res.json({
            success: true,
            data: results,
            hasNextPage,
            nextCursor
        })

    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}



export { createUserProfile, GetUserProfile, updateUserProfile, deleteProfile, getAllPayments, getAllDayPasses }