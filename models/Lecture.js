import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  originalname: { type: String },
  url: { type: String }, // Cloudinary URL
  public_id: { type: String },
  size: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
  // optional: keep legacy fields for compatibility
  title: { type: String },
  type: { type: String, enum: ["live", "recorded"], default: "recorded" }
});

export default mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);
