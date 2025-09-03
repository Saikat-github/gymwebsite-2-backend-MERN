import Razorpay from 'razorpay';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';


if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Razorpay keys are not set in environment variables');
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


const createOrder = async (amount, id, currency = "INR") => {
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid amount provided');
  }

  try {
    return await razorpayInstance.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: `rcpt_${uuidv4().slice(0, 20)}`
    });
  } catch (err) {
    throw new Error(err.error?.description || err.message || 'Error creating Razorpay order');
  }
};




/**
 * Verify payment signature
 */
const verifyOrder = (paymentDetails) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return generatedSignature === razorpay_signature;
};




/**
 * Verify webhook signature
 */
const verifyWebhookSignature = (razorpaySignature, webhookBody) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(webhookBody))
    .digest('hex');

  return expectedSignature === razorpaySignature;
};

export { razorpayInstance, createOrder, verifyOrder, verifyWebhookSignature };
