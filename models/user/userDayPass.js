import mongoose from "mongoose";

const userDayPassSchema = new mongoose.Schema(
    {
        userAuthId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userAuth", // reference to your auth model
            required: true,
            index: true, // for faster lookup
        },
        passId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        age: {
            type: Number,
            required: true,
            min: [12, "Minimum age must be 12 years"],
            max: [100, "Age cannot exceed 100 years"],
        },
        phone: {
            type: String,
            required: true,
            match: [/^[6-9]\d{9}$/, 'Invalid phone number'] // Indian format example
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
        },
        noOfDays: {
            type: Number,
            required: true,
            min: [1, "Day pass must be for at least 1 day"],
            max: [7, "Day pass cannot exceed 30 days"], // optional cap
        },
        availed: {
            type: Boolean,
            default: false,
            index: true,
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userPayment", // links to your payments collection
            required: true,
        },
        terms: {
            type: Boolean,
            required: true,
            validate: {
                validator: function (v) {
                    return v === true; // must accept terms
                },
                message: "You must accept terms and conditions to proceed",
            },
        },
    },
    { timestamps: true }
);


userDayPassSchema.index({ name : 1 });


const userDayPassModel = mongoose.model("userDayPass", userDayPassSchema);

export default userDayPassModel;