import userAuthModel from "../../models/user/userAuth.js";
import { applyPagination, applyPaginationForDayPasses } from "../../utils/applyPagination.js";
import userProfileModel from '../../models/user/userProfile.js';
import userPaymentModel from '../../models/user/userPayment.js';
import userDayPassModel from '../../models/user/userDayPass.js';



//API to get dashboard data for admin panel 
//MongoDB aggregation pipeline
const getDashData = async (req, res) => {
    try {
        const [userStats, profileStats] = await Promise.all([
            userAuthModel.countDocuments({}),
            userProfileModel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProfiles: { $sum: 1 },
                        maleCount: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$personalInfo.gender", "male"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        femaleCount: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$personalInfo.gender", "female"] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ])
        ]);

        const profileData = profileStats[0] || { totalProfiles: 0, maleCount: 0, femaleCount: 0 };

        const dashData = {
            totalRegisteredUsers: userStats,
            totalProfiles: profileData.totalProfiles,
            maleCount: profileData.maleCount,
            femaleCount: profileData.femaleCount
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.error('Dashboard data fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data'
        });
    }
};




const getAllMembers = async (req, res) => {
    try {
        const { name, startDate, endDate, statusFilter, cursor } = req.query;

        let query = {};
        if (startDate && endDate) {
            // Validate date formats
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            // Check if dates are valid
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                return res.json({
                    success: false,
                    message: "Invalid date format. Please use YYYY-MM-DD or ISO 8601 format."
                });
            }

            // Compare dates
            if (startDateObj > endDateObj) {
                return res.json({
                    success: false,
                    message: "Start date should be less than or equal to end date."
                });
            }

            query = {
                createdAt: {
                    $gte: startDateObj,
                    $lte: endDateObj,
                },
            };
        }

        if (name) query["personalInfo.name"] = new RegExp(name, 'i');
        if (statusFilter) query["membership.status"] = statusFilter;

        const { results, hasNextPage, nextCursor } = await applyPagination(query, userProfileModel, cursor);

        res.json({
            success: true,
            members: results,
            hasNextPage,
            nextCursor
        });
    } catch (error) {
        console.error("Error fetching members:", error);
        res.status(500).json({ success: false, message: "Some error occurred, please refresh the window" });
    }
};



//Get single member
const getSingleMember = async (req, res) => {
    try {
        const { userAuthId } = req.query;
        const member = await userProfileModel.findOne({ userAuthId });
        if (!member) {
            return res.json({
                success: false,
                message: "Member not found!"
            })
        }

        res.json({ success: true, member })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}






const getAllUsers = async (req, res) => {
    try {
        const { search, startDate, endDate, cursor } = req.query;

        let query = {};
        if (startDate && endDate) {
            // Validate date formats
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            // Check if dates are valid
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                return res.json({
                    success: false,
                    message: "Invalid date format. Please use YYYY-MM-DD or ISO 8601 format."
                });
            }

            // Compare dates
            if (startDateObj > endDateObj) {
                return res.json({
                    success: false,
                    message: "Start date should be less than or equal to end date."
                });
            }

            query = {
                createdAt: {
                    $gte: startDateObj,
                    $lte: endDateObj,
                },
            };
        }

        if (search && search.trim() !== '') {
            query.email = new RegExp(search.trim(), 'i');
        }

        const { results, hasNextPage, nextCursor } = await applyPagination(query, userAuthModel, cursor);

        res.json({
            success: true,
            users: results,
            hasNextPage,
            nextCursor
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.json({ success: false, message: "Some error occurred, please refresh the window" });
    }
};




//Get all payments
const getAllPayments = async (req, res) => {
    try {
        const { startDate, endDate, cursor } = req.query;

        let query = {};
        if (startDate && endDate) {
            // Validate date formats
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            // Check if dates are valid
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                return res.json({
                    success: false,
                    message: "Invalid date format. Please use YYYY-MM-DD or ISO 8601 format."
                });
            }

            // Compare dates
            if (startDateObj > endDateObj) {
                return res.json({
                    success: false,
                    message: "Start date should be less than or equal to end date."
                });
            }

            query = {
                createdAt: {
                    $gte: startDateObj,
                    $lte: endDateObj,
                },
            };
        }

        const { results, hasNextPage, nextCursor } = await applyPagination(query, userPaymentModel, cursor);

        res.json({
            success: true,
            payments: results,
            hasNextPage,
            nextCursor
        });
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ success: false, message: "Some error occurred, please refresh the window" });
    }
};




//Get all payments for an user
const getSingleUserPayments = async (req, res) => {
    try {
        const { cursor, userAuthId } = req.query;

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
            payments: results,
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





//Get all daypasses
const getAllDayPasses = async (req, res) => {
    try {
        const { search, startDate, endDate, cursor } = req.query;

        let query = {};
        if (startDate && endDate) {
            // Validate date formats
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            // Check if dates are valid
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                return res.json({
                    success: false,
                    message: "Invalid date format. Please use YYYY-MM-DD or ISO 8601 format."
                });
            }

            // Compare dates
            if (startDateObj > endDateObj) {
                return res.json({
                    success: false,
                    message: "Start date should be less than or equal to end date."
                });
            }

            query = {
                createdAt: {
                    $gte: startDateObj,
                    $lte: endDateObj,
                },
            };
        }

        if (search) query.name = new RegExp(search, 'i');

        const { results, hasNextPage, nextCursor } = await applyPaginationForDayPasses(query, userDayPassModel, cursor);

        res.json({
            success: true,
            dayPasses: results,
            hasNextPage,
            nextCursor
        });
    } catch (error) {
        console.error("Error fetching dayPasses:", error);
        res.status(500).json({ success: false, message: "Some error occurred, please refresh the window" });
    }
};




//Get single day pass
const getSingleDayPass = async (req, res) => {
    try {
        const { paymentId } = req.query;
        const dayPass = await userDayPassModel.findOne({ paymentId }).populate({
            path: "paymentId",  // 👈 populate paymentId
            select: "amount paymentStatus planEndDate paymentDate paymentId, paymentMethod" // only select needed fields
        });
        ;
        if (!dayPass) {
            return res.json({
                success: false,
                message: "DayPass not found!"
            })
        }

        res.json({ success: true, dayPass })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}




export { getDashData, getAllMembers, getAllUsers, getSingleMember, getSingleUserPayments, getAllPayments, getAllDayPasses, getSingleDayPass };