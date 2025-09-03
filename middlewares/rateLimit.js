import rateLimit from 'express-rate-limit';

const globalRateLimiter =  rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please later after 1 hour."
});


const sendUserOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: 'Too many OTP requests. Please try again later after 15 minutes.'
});


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try after 15 minutes"
})



const paymentRequestLimiter =  rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many requests from this IP, please try after 10 minutes."
});



export  {globalRateLimiter, sendUserOtpLimiter, loginLimiter, paymentRequestLimiter };