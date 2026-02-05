import mongoose from "mongoose";
import { createOrder, razorpayInstance, verifyOrder, verifyWebhookSignature } from "../../config/razorpay.js";
import { createOrUpdateMembership } from "../../utils/createOrUpdateMembership.js";
import { generateSerialNumber } from "../../utils/generateSerialNumber.js";
import planModel from "../../models/admin/plans.js";
import userAuthModel from "../../models/user/userAuth.js";
import userDayPassModel from "../../models/user/userDayPass.js";
import userProfileModel from "../../models/user/userProfile.js";
import userPaymentModel from "../../models/user/userPayment.js";






const createMembership = async (req, res) => {
  try {
    const { planId, dayPassData } = req.body;
    const { userAuthId } = req;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ success: false, message: "Invalid planId" });
    }

    const planDetails = await planModel.findById(planId);
    if (!planDetails) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }


    let planPrice;
    if (planDetails.title === 'day-pass') {
      const { name, age, noOfDays, terms, phone, email } = dayPassData;
      if (!name || !age || !noOfDays || !terms || !phone || !email) {
        return res.json({ success: false, message: "If you're buying day-pass, please fill all the required details!" })
      }
      planPrice = planDetails.price * noOfDays;
    } else {
      const userProfile = await userProfileModel.findOne({ userAuthId });
      if (!userProfile) {
        return res.json({ success: false, message: "User profile not found!" })
      }
      planPrice = planDetails.price;
    }

    const order = await createOrder(planPrice, userAuthId);

    const newPayment = await userPaymentModel.create({
      userAuthId,
      planId,
      planType: planDetails.title,
      planDuration: planDetails.duration, // fixed field name
      amount: planPrice,
      orderId: order.id,
      paymentStatus: "created"
    });

    if (planDetails.title === "day-pass") {
      const newDayPassId = await generateSerialNumber("DP")
      await userDayPassModel.create({
        userAuthId,
        passId: newDayPassId,
        ...dayPassData,
        paymentId: newPayment._id
      });
    }


    res.json({
      success: true,
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      currency: order.currency,
      amount: planPrice
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
}






const verifyMembership = async (req, res) => {
  try {
    const { userAuthId } = req;
    const paymentDetails = req.body;

    const user = await userAuthModel.findById(userAuthId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 1. Verify signature (prevent tampering)
    if (!verifyOrder(paymentDetails)) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 2. Verify payment actually succeeded on Razorpay (prevent fraud)
    const paymentInfo = await razorpayInstance.payments.fetch(paymentDetails.razorpay_payment_id);
    if (paymentInfo.status !== "captured") {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    // 3. Process membership (with idempotency check inside)
    const updated = await createOrUpdateMembership(paymentDetails, paymentInfo.method);
    if (updated?.alreadyProcessed) {
      return res.status(200).json({ success: true, message: "Payment already processed" });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${updated.planType} plan`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};






//Webhook Handler Function Will be implemented after application deployment as razorpay required an public url in the webhook configuration. I have made an in-depth notes on why and how to implement webhook in production grade application, reference to this application(bookmyuser). Please see the reference. 

const razorpayWebhookHandler = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const sig = req.headers["x-razorpay-signature"];
    const body = req.body;

    if (!verifyWebhookSignature(sig, body)) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const { event, payload } = req.body;
    const entity = payload?.payment?.entity || payload?.order?.entity;

    if (event === "payment.captured" || event === "order.paid") {
      const { order_id: orderId, id: paymentId, method } = entity;

      const result = await createOrUpdateMembership({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
      }, method);

      console.log(`Webhook processed: ${event}`, {
        orderId,
        paymentId,
        alreadyProcessed: result?.alreadyProcessed,
        duration: Date.now() - startTime
      });

      return res.status(200).json({ success: true, message: "Membership updated" });
    }

    return res.status(200).json({ success: true, message: "Event ignored" });
  } catch (e) {
    console.error("Webhook error:", e);
    // Return 200 for business logic errors to prevent retries
    if (e.name === 'ValidationError' || e.statusCode < 500) {
      return res.status(200).json({ success: false });
    }
    return res.status(500).json({ success: false });
  }
};



export { createMembership, verifyMembership, razorpayWebhookHandler }