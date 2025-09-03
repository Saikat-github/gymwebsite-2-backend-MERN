import mongoose from "mongoose";

const userPaymentSchema = new mongoose.Schema({
    userAuthId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAuth',
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'plan',
    },
    planType: {
        type: String,
        required: true
    },
    planDuration: {
        type: Number,
        required: [true, "Plan duration is required"],
        min: [1, "Duration must be at least 1 day"]
    },
    planStatus: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "INR"
    },
    paymentMethod: {
        type: String,
    },
    orderId: {
        type: String,
        required: function () { return this.paymentMode === 'online'; },
    },
    paymentId: {
        type: String
    },
    paymentStatus: {
        type: String,
        default: 'pending'
    },
    planEndDate: {
        type: Date,
        default: null
    },
    paymentDate: {
        type: Date,
        default: null
    },
}, { timestamps: true });



userPaymentSchema.index({ userAuthId: 1, paymentStatus: 1 });
userPaymentSchema.index({ orderId: 1 }, { unique: true, sparse: true });

const userPaymentModel = mongoose.model('userPayment', userPaymentSchema);
export default userPaymentModel;
