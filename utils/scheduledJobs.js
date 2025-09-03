import cron from 'node-cron';
import userProfileModel from '../models/user/userProfile.js';
import { sendReminderEmail, sendSubscriptionExpiredEmail } from './email.js';




// Helper for batching async functions
const batchProcess = async (items, batchSize, callback) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(callback));
  }
};

// Expired subscriptions
const checkExpiredSubscriptions = async () => {
  try {
    const now = new Date();

    const expiringUsers = await userProfileModel.find(
      {
        'membership.endDate': { $lt: now },
        'membership.status': { $ne: 'expired' }
      },
      {
        _id: 1,
        'personalInfo.name': 1,
        'personalInfo.email': 1,
        membership: 1
      }
    );

    if (!expiringUsers.length) {
      console.log(`[${new Date().toISOString()}] No expired subscriptions.`);
      return;
    }

    // Bulk update
    const userProfileIds = expiringUsers.map(user => user._id);
    await userProfileModel.updateMany(
      { _id: { $in: userProfileIds } },
      { $set: { 'membership.status': 'inactive' } }
    );

    // Send emails in batches of 50
    await batchProcess(expiringUsers, 50, user =>
      sendSubscriptionExpiredEmail(
        user.personalInfo.email,
        user.personalInfo.name,
        user.membership.endDate
      )
    );

    console.log(
      `[${new Date().toISOString()}] Updated ${userProfileIds.length} expired subscriptions and sent emails.`
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in expired subscriptions:`, error);
  }
};

// Subscription reminders
const sendSubscriptionReminders = async () => {
  try {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const userProfiles = await userProfileModel.find(
      {
        'membership.endDate': { $gte: now, $lte: threeDaysLater },
        'membership.status': { $ne: 'inactive' }
      },
      {
        'personalInfo.name': 1,
        'personalInfo.email': 1,
        membership: 1
      }
    );

    if (!userProfiles.length) {
      console.log(`[${new Date().toISOString()}] No upcoming expirations.`);
      return;
    }

    // Send reminder emails in batches
    await batchProcess(userProfiles, 50, user =>
      sendReminderEmail(
        user.personalInfo.email,
        user.personalInfo.name,
        user.membership.endDate
      )
    );

    console.log(
      `[${new Date().toISOString()}] Sent reminders to ${userProfiles.length} members.`
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error sending reminders:`, error);
  }
};

// Setup cron jobs
const setupCronJobs = () => {
  // Expired subscriptions at 00:05
  cron.schedule('0 5 0 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running expired subscription check`);
    await checkExpiredSubscriptions();
  });

  // Reminders at 08:00
  cron.schedule('0 0 8 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running subscription reminders`);
    await sendSubscriptionReminders();
  });

  console.log('Cron jobs scheduled successfully');
};

export { setupCronJobs };
