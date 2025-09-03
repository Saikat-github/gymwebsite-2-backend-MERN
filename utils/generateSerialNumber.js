import counterModel from "../models/others/counterModel.js";



export const generateSerialNumber = async (prefix="DP") => {
  const year = new Date().getFullYear().toString();
  const id = `${prefix}-${year}`

  // Atomically increment the counter for the current year
  const counter = await counterModel.findByIdAndUpdate(
    id,
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // Create if doesn't exist
  );

  const serial = counter.seq.toString().padStart(4, "0"); // e.g., 0001, 0256
  return `${id}-${serial}`;
}


