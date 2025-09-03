import planModel from "../../models/admin/plans.js"


const addNewPlan = async (req, res) => {
    try {
        const frontendData = req.body;
        const newPlan = await planModel.create(frontendData);
        res.json({ success: true, message: "New plan added successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


const updatePlan = async (req, res) => {
    try {
        const { planId, ...updatedData } = req.body;
        const plan = await planModel.findById(planId);
        if (!plan) {
            return res.json({ success: false, message: "Plan not found" });
        }
        await planModel.findByIdAndUpdate(planId, updatedData, { new: true });
        res.json({ success: true, message: "Plan updated successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


const deletePlan = async (req, res) => {
    try {
        const { planId } = req.body;
        const plan = await planModel.findById(planId);
        if (!plan) {
            return res.json({ success: false, message: "Plan not found" });
        }
        await planModel.findByIdAndDelete(planId);
        res.json({ success: true, message: "Plan deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}



const getPlans = async (req, res) => {
    try {
        const allPlans = await planModel.find({});

        res.json({ success: true, data: allPlans })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}





export { getPlans, addNewPlan, updatePlan, deletePlan };