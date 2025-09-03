import mongoose from "mongoose";
import dotenv from "dotenv/config";
import planModel from "../models/admin/plans.js";
import counterModel from "../models/others/counterModel.js";
import bcrypt from 'bcrypt';
import adminAuthModel from '../models/admin/adminAuth.js';





// const createFirstCounter = async () => {
//   try {
//     await mongoose.connect(`mongodb+srv://saikatsaharph:nIyMOzJzGaCP5yX5@cluster0.4mqz16w.mongodb.net/gym`);

//     const newCounter = {
//       _id: "2025", // Year
//       seq: 0     // Last assigned member number
//     }

//     await counterModel.create(newCounter)


//     console.log("🎯 Seeding completed.");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Seeding failed:", err);
//     process.exit(1);
//   }
// };


// createFirstCounter();











const createFirstAdmin = async () => {
  try {
    await mongoose.connect(`mongodb+srv://saikatsaharph:nIyMOzJzGaCP5yX5@cluster0.4mqz16w.mongodb.net/gym`);

    const existingAdmin = await adminAuthModel.findOne({ email: "saikatservices@gmail.com" });
    if (existingAdmin) {
      console.log('Super admin already exists');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Saikat@123", salt);

    await new adminAuthModel({
      email: "saikatservices@gmail.com",
      password: hashedPassword,
      userType: 'super_admin',
    }).save();

    console.log('First admin created');
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

createFirstAdmin();














// const seedPlans = async () => {
//   try {
//     await mongoose.connect(`mongodb+srv://saikatsaharph:nIyMOzJzGaCP5yX5@cluster0.4mqz16w.mongodb.net/gym`);

//     const plans = [
//       {
//         title: "day-pass",
//         description: "Ideal for short-term commitment",
//         duration: 7,
//         price: 99,
//         discount: 0,
//         features: ["Access to gym facilities"]
//       },
//       {
//         title: "quarterly",
//         description: "Save more with a 3-month subscription",
//         duration: 90,
//         price: 1999,
//         features: ["Access to gym facilities", "Free group classes"]
//       },
//       {
//         title: "half-Yearly",
//         description: "Best for consistent fitness goals",
//         duration: 180,
//         price: 3599,
//         features: ["Access to gym facilities", "Free group classes"]
//       },
//       {
//         title: "yearly",
//         description: "Maximum savings for a full-year commitment",
//         duration: 365,
//         price: 5999,
//         features: ["Access to gym facilities", "Free group classes"]
//       }
//     ];

//     for (const plan of plans) {
//       const exists = await planModel.findOne({ title: plan.title });
//       if (!exists) {
//         await planModel.create(plan);
//         console.log(`✅ Inserted: ${plan.title}`);
//       } else {
//         console.log(`⚠️ Skipped (already exists): ${plan.title}`);
//       }
//     }

//     console.log("🎯 Seeding completed.");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Seeding failed:", err);
//     process.exit(1);
//   }
// };

// seedPlans();

