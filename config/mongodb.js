import mongoose from "mongoose";
import { setupCronJobs } from "../utils/scheduledJobs.js";


const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("Connected to MongoDB");
            try {
                setupCronJobs();
            } catch (error) {
                console.log("Failed to setup scheduled cron jobs", error)
            }
        });
        await mongoose.connect(`${process.env.MONGO_URI}/gym`);
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

export default connectDB;