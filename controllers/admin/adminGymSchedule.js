import gymScheduleModel from "../../models/admin/gymSchedule.js";




const addGymSchedule = async (req, res) => {
    try {
        const data = req.body;
        console.log(data)

        const newSchedule = new gymScheduleModel(data);
        await newSchedule.save();
        res.json({success: true, message: "Gym schedule added successfully", schedule: newSchedule});
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error adding gym schedule" });
    }
}


const updateGymSchedule = async (req, res) => {
    try {
        const {scheduleId, ...data} = req.body;
        const schedule = await gymScheduleModel.findById(scheduleId);

        if (!schedule) {
            return res.json({ success: false, message: "Gym schedule not found" });
        }

        const updatedSchedule = await gymScheduleModel.findByIdAndUpdate(scheduleId, data, { new: true });
        res.json({ success: true, message: "Gym schedule updated successfully", schedule: updatedSchedule});
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating gym schedule" });
    }
}




const getGymSchedule = async (req, res) => {
    try {
        const schedule = await gymScheduleModel.find({});
        res.json({ success: true, schedule: schedule[0] });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching gym schedule" });
    }
}




export { addGymSchedule, updateGymSchedule, getGymSchedule}