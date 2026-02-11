import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const frontendUrl = process.env.FRONTEND_URL

const FROM_EMAIL = process.env.EMAIL_FROM




const sendEmailWithRetry = async (emailOptions, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const {data, error} = await resend.emails.send(emailOptions); 
      if (error) {
        console.log({error})
        throw new Error({error})
      }
    } catch (error) {
      console.log(`❌ Email attempt ${attempt} failed:`);

      if (attempt === maxRetries) {
        throw new Error(`Failed to send email after ${maxRetries} attempts`);
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};



//OTP sending mail
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: 'OTP for Minimalist Gym',
    html: `
        <h2>OTP verificaton request for Minimalist Gym panel</h2>
        <p>Your OTP is <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>

        <br>
        <br>
        <p><strong>Team Minimalist Gym.</strong></p> </div>`
  };
  await sendEmailWithRetry(mailOptions);
};



//Subcription expiration mail sending
const sendSubscriptionExpiredEmail = async (email, name = "User", endDate) => {
  const date = new Date(endDate);
  const options = { month: 'long', day: 'numeric', year: 'numeric' };

  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: 'Your Membership Has Expired. Renew Now!',
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#007BFF;">Subscription Expired</h2> <p>Hi ${name},</p> <p>Your membership has expired on ${date.toLocaleDateString('en-US', options)}.</p> <p>To continue using our gym services, we recommend subscribing to a suitable plan.</p> <a href="${frontendUrl}/plans" style="display:inline-block;padding:10px 15px;background-color:#28a745;color:#fff;border-radius:5px;text-decoration:none;">Renew Membership </a>  <p>Warm regards,<br><strong>Team Minimalist Gym.</strong></p> </div>`
  };
  await sendEmailWithRetry(mailOptions);
}



//Subscription reminder mail sending
const sendReminderEmail = async (email, name, endDate) => {
  const daysLeft = Math.ceil(
    (endDate - new Date()) / (1000 * 60 * 60 * 24)
  );
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `Your membership is expiring in ${daysLeft} days`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#ff8800;">Your Membership is Ending Soon</h2> <p>Hi ${name},</p> <p>You have <strong>${daysLeft} days</strong> remaining in your active membership.</p> <p>Don't miss out on uninterrupted access to <strong>Minimalist Gym</strong>.</p> <a href="${frontendUrl}/plans" style="display:inline-block;padding:10px 15px;background-color:#007BFF;color:#fff;border-radius:5px;text-decoration:none;">Renew Now</a> <p style="margin-top:30px;">Thank you for being with us.</p> <p>Warm wishes,<br><strong>Team Minimalist Gym</strong></p> </div>
      `
  }
  await sendEmailWithRetry(mailOptions);
}




//Profile Deletion Mail
const sendProfileDeletionMail = async (email, name = "User") => {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `Profile Deleted`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#dc3545;">Profile Deleted</h2> <p>Hi ${name},</p> <p>We're confirming that your profile in <strong>Minimalist Gym</strong> has been deleted.</p> <p>This means you no longer have access to features or booking capabilities.</p> <p>If this was a mistake, or you change your mind, you can always create a new profile:</p> <a href="${frontendUrl}/profile" style="display:inline-block;padding:10px 15px;background-color:#007BFF;color:#fff;border-radius:5px;text-decoration:none;">Create Profile</a> <p>Thanks again for trying Minimalist Gym.</p> <p>Warm regards,<br><strong>Team Minimalist Gym.</strong></p> </div>`
  };
  await sendEmailWithRetry(mailOptions);
}



//Account Deletion Mail
const sendAccountDeletionMail = async (email, name = "User") => {
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: `Account Deleted`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"> <h2 style="color:#dc3545;">Account Deleted</h2> <p>Hi ${name},</p> <p>We're confirming that your account and all profile data in <strong>Minimalist Gym.</strong> has been deleted.</p> <p>This means you no longer have access to features or booking capabilities.</p> <p>If this was a mistake, or you change your mind, you can always create a new Account:</p> <a href="${frontendUrl}" style="display:inline-block;padding:10px 15px;background-color:#007BFF;color:#fff;border-radius:5px;text-decoration:none;">Create Account</a> <p>Thanks again for trying Minimalist Gym.</p> <p>Warm regards,<br><strong>Team Minimalist Gym.</strong></p> </div>`
  };
  await sendEmailWithRetry(mailOptions);
}





// Helper functions -- Helper functions -- Helper functions 
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


const isOTPExpired = (expiryDate) => {
  return new Date() > expiryDate;
};





export {
  generateOTP,
  isOTPExpired,
  sendOTPEmail,
  sendReminderEmail,
  sendSubscriptionExpiredEmail,
  isValidEmail,
  sendProfileDeletionMail,
  sendAccountDeletionMail
};