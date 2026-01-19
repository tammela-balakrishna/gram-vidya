import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema({
  originalname: { type: String, required: true },
  url: { type: String, required: true }, // Cloudinary URL
  public_id: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
});

export default mongoose.models.Pdf || mongoose.model("Pdf", pdfSchema);
