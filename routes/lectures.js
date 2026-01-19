// routes/lectures.js
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { verifyAdmin, verifyUser } from "../middleware/auth.js";
import Lecture from "../models/Lecture.js";

const router = express.Router();

// Multer: keep file in memory, we'll stream it to Cloudinary
const upload = multer({ storage: multer.memoryStorage() }).single("pdf");

router.post("/upload", verifyAdmin, (req, res) => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error("Lecture upload attempted but Cloudinary credentials are missing.");
    return res
      .status(500)
      .json({ error: "Server misconfiguration: missing Cloudinary credentials" });
  }

  upload(req, res, async function (uploadErr) {
    if (uploadErr) {
      console.error("Cloudinary/Multer upload error:", uploadErr);

      const isTimeout =
        uploadErr.http_code === 499 || uploadErr.name === "TimeoutError";

      return res.status(isTimeout ? 504 : 502).json({
        error: isTimeout
          ? "Upload timed out while contacting Cloudinary. Please check your internet and try again."
          : "Upload failed while uploading to Cloudinary.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const nameWithoutExt = req.file.originalname.replace(/\.[^/.]+$/, "");
    const publicId = `${Date.now()}-${nameWithoutExt}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "gram-vidya/lectures",
        resource_type: "auto",
        public_id: publicId,
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Upload failed" });
        }

        const lecture = new Lecture({
          originalname: req.file.originalname,
          url: result.secure_url,          // use Cloudinary URL
          public_id: result.public_id,     // store actual public id
          size: req.file.size || null,
          uploadedBy: req.user._id,
        });

        await lecture.save();
        res.json({ message: "Lecture uploaded successfully", pdf: lecture });
      }
    );

    // IMPORTANT: actually send the file buffer to Cloudinary
    stream.end(req.file.buffer);
  });
});

export default router;
