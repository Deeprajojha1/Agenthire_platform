import dotenv from "dotenv";
import mongoose from "mongoose";
import Candidate from "../src/models/Candidate.js";
import User from "../src/models/User.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const candidates = await Candidate.find({ candidate_user_id: { $ne: null } }).select("_id email candidate_user_id").lean();
let fixed = 0;

for (const candidate of candidates) {
  const user = await User.findById(candidate.candidate_user_id).select("email").lean();
  const candidateEmail = (candidate.email || "").trim().toLowerCase();
  const userEmail = (user?.email || "").trim().toLowerCase();

  if (!user || candidateEmail !== userEmail) {
    await Candidate.updateOne({ _id: candidate._id }, { $set: { candidate_user_id: null } });
    fixed += 1;
  }
}

console.log(JSON.stringify({ checked: candidates.length, fixed }, null, 2));
await mongoose.disconnect();
