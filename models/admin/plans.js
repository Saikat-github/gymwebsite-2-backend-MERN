import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Plan name is required"],
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        duration: {
            type: Number,
            required: [true, "Plan duration is required"],
            min: [1, "Duration must be at least 1 day"]
        },
        price: {
            type: Number,
            required: [true, "Plan price is required"],
            min: [0, "Price must be a positive number"]
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, "Discount cannot be negative"],
            max: [100, "Discount cannot exceed 100%"]
        },
        isActive: {
            type: Boolean,
            default: true
        },
        features: {
            type: [String],
            default: [],
        },
        noOfChosen: {
            type: Number,
            default: 0,
            min: [0, "noOfChosen cannot be negative"]
        }
    },
    {
        timestamps: true
    }
);




const planModel = mongoose.model('plan', planSchema);

export default planModel;
