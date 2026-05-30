import mongoose from "mongoose";
import { setupCronJobs } from "../utils/scheduledJobs.js";


const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/gym`);
        console.log("MongoDB connected");
        // try {
        //     setupCronJobs();
        // } catch (error) {
        //     console.log("Failed to setup scheduled cron jobs", error)
        // }
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;

