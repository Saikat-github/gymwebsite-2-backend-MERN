import mongoose from "mongoose";


const Schema = mongoose.Schema;



const gymScheduleSchema = new Schema({
    monday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false }
    },
    tuesday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false }
    },
    wednesday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false }
    },
    thursday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false }
    },
    friday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false }
    },
    saturday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false }
    },
    sunday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false }
    },

    timezone: {
        type: String,
        required: true,
        default: 'UTC'
    }
}, {
    timestamps: true,
});




const gymScheduleModel = mongoose.models.gymSchedule || mongoose.model('gymSchedule', gymScheduleSchema);

export default gymScheduleModel;