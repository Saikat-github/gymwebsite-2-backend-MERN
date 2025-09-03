import mongoose from "mongoose";
import planModel from "../models/admin/plans.js";
import userPaymentModel from "../models/user/userPayment.js";
import userProfileModel from "../models/user/userProfile.js";




export const createOrUpdateMembership = async (paymentDetails, method = "online") => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id } = paymentDetails;

    // 1) Atomic idempotency gate
    const paymentDoc = await userPaymentModel
      .findOne({ orderId: razorpay_order_id, paymentStatus: { $ne: "paid" } })
      .session(session);

    if (!paymentDoc) {
      await session.abortTransaction();
      session.endSession();
      return { alreadyProcessed: true };
    }

    // 2) Compute membership end date
    const now = new Date();
    let endDate = new Date(now);
    const planDurationDays = paymentDoc.planDuration;


    // 3) Checking whether day pass or normal membership
    if (paymentDoc.planType !== "day-pass") {
      const userProfile = await userProfileModel
        .findOne({ userAuthId: paymentDoc.userAuthId })
        .session(session);
      if (!userProfile) throw new Error("User profile not found");

      if (userProfile.membership?.status === "active" && userProfile.membership.endDate && userProfile.membership.endDate > now) {
        endDate = new Date(userProfile.membership.endDate);
      }

      endDate.setDate(endDate.getDate() + planDurationDays);

      await userProfileModel.findByIdAndUpdate(
        userProfile._id,
        {
          $set: {
            "membership.status": "active",
            "membership.planId": paymentDoc.planId,
            "membership.planType": paymentDoc.planType,
            "membership.endDate": endDate,
            "membership.lastPaymentDate": now,
            "membership.lastPaymentId": paymentDoc._id,
          },
        },
        { new: true, runValidators: true, session }
      );
    } else {
      endDate.setDate(endDate.getDate() + planDurationDays);
    }


    // 4) Update payment record
    await userPaymentModel.findOneAndUpdate(
      { orderId: razorpay_order_id, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          planStatus: "active",
          paymentStatus: "paid",
          paymentId: razorpay_payment_id,
          planEndDate: endDate,
          paymentDate: now,
          paymentMethod: method,
        },
      },
      { new: true, session }
    );

    // 5) Increment plan usage analytics
    await planModel.findByIdAndUpdate(
      paymentDoc.planId,
      { $inc: { noOfChosen: 1 } },
      { upsert: true, new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    return { planType: paymentDoc.planType };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error.message || "Error updating membership");
  }
};
