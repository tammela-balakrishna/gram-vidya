// routes/pdf.js
import express from "express";
import multer from "multer";
import axios from "axios";
import { cloudinary, urlForPublicId } from "../utils/cloudinaryClient.js";
import { verifyAdmin, verifyUser } from "../middleware/auth.js";
import Pdf from "../models/Pdf.js";

const router = express.Router();

// Use memory storage to handle the file buffer directly
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Upload PDF (Admin only)
 * POST /api/pdf/upload
 * field name: "pdf"
 */
router.post("/upload", verifyAdmin, upload.single("pdf"), async (req, res) => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error("PDF upload attempted but Cloudinary credentials are missing.");
    return res
      .status(500)
      .json({ error: "Server misconfiguration: missing Cloudinary credentials" });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Uploading file to Cloudinary...");

    const nameWithoutExt = req.file.originalname.replace(/\.[^/.]+$/, "");
    const publicId = `${Date.now()}-${nameWithoutExt}`;

    // Upload via stream
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: "gram-vidya/pdfs",
          resource_type: "raw", // Important for PDFs to be accessible as files
          public_id: publicId,
          format: "pdf", // Force PDF extension if needed, though raw usually keeps original
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    console.log("Cloudinary upload result:", result);

    const pdf = new Pdf({
      originalname: req.file.originalname,
      url: result.secure_url,
      public_id: result.public_id,
      size: req.file.size,
      uploadedBy: req.user?._id || null,
      uploadedAt: new Date(),
    });

    await pdf.save();

    return res.json({
      message: "PDF uploaded successfully",
      pdf,
    });
  } catch (err) {
    console.error("Upload/DB error:", err);
    return res.status(500).json({ 
      error: "Upload failed", 
      detail: err.message 
    });
  }
});

/**
 * Get PDFs (any logged-in user)
 * GET /api/pdf
 */
router.get("/", verifyUser, async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ uploadedAt: -1 });

    const mapped = pdfs.map((p) => {
      const thumb = p.public_id
        ? urlForPublicId(p.public_id, {
            width: 400,
            height: 300,
            crop: "fill",
            fetch_format: "auto",
          })
        : p.url;

      return { ...p.toObject(), thumbnail: thumb };
    });

    res.json(mapped);
  } catch (err) {
    console.error("Error fetching PDFs:", err);
    res.status(500).json({ error: "Failed to fetch PDFs" });
  }
});

/**
 * Download PDF via backend (optional but recommended)
 * GET /api/pdf/download/:id
 */
router.get("/download/:id", verifyUser, async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf || !pdf.url) {
      return res.status(404).send("PDF not found");
    }

    // The file is private/authenticated.
    // If standard signing fails, it's often because the public_id for RAW files
    // includes the extension in the DB, but the signature generation expects it differently.
    // Let's try generating the URL *without* the extension in the public_id param, 
    // but keeping the format.
    
    // Debug: Fetch resource details from Cloudinary Admin API to understand the exact state
    try {
        const resource = await cloudinary.v2.api.resource(pdf.public_id, { resource_type: "raw" });
        console.log("Cloudinary Resource Details:", {
            public_id: resource.public_id,
            format: resource.format,
            resource_type: resource.resource_type,
            type: resource.type,
            access_mode: resource.access_mode,
            url: resource.url,
            secure_url: resource.secure_url
        });
        
        // Use the secure_url from the API response if available
        // If it's restricted, we might need to sign it.
        // But let's see what the API says first.
        
        // If the API returns a URL, try to use it (it might be unsigned if we are admin)
        // But we need to sign it for the user? 
        // Actually, the API returns the canonical URL.
        
        // Let's try to construct the signed URL based on the API's public_id and version
        const version = resource.version;
        const publicId = resource.public_id;
        
        const downloadUrl = cloudinary.v2.utils.url(publicId, {
            resource_type: "raw",
            type: resource.type, // Use the type returned by API
            sign_url: true,
            secure: true,
            version: version,
            format: resource.format // Use format if it exists
        });
        
        console.log("Fetching from Cloudinary (Debug Constructed):", downloadUrl);

        const response = await axios({
            url: downloadUrl,
            method: "GET",
            responseType: "stream",
        });
        
        // Pipe the response stream to the client
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${pdf.originalname}"`);
        response.data.pipe(res);
        return; // Exit after successful stream

    } catch (debugErr) {
        console.error("Debug Resource Fetch Failed:", debugErr.message);
        // Fallback to previous logic if Admin API fails (e.g. permissions)
    }

    // ... existing fallback logic ...
    console.log("PDF Info:", { id: pdf._id, public_id: pdf.public_id, url: pdf.url });

    // Extract version from the stored URL (e.g., .../v123456/...)
    const versionMatch = pdf.url && pdf.url.match(/\/v(\d+)\//);
    const version = versionMatch ? versionMatch[1] : undefined;

    const downloadUrl = cloudinary.v2.utils.url(pdf.public_id, {
      resource_type: "raw",
      type: "upload", 
      sign_url: true,
      secure: true,
      version: version // Explicitly use the version from upload
    });

    console.log("Fetching from Cloudinary (Signed + Version):", downloadUrl);

    const response = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream",
    });

    const disposition = req.query.inline === "true" ? "inline" : "attachment";

    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${pdf.originalname || "file.pdf"}"`
    );
    res.setHeader("Content-Type", "application/pdf");

    response.data.pipe(res);
  } catch (err) {
    console.error("Download error:", err.message);
    if (err.response) {
       console.error("Cloudinary response:", err.response.status, err.response.statusText);
    }
    if (!res.headersSent) res.status(500).send("Download failed");
  }
});

export default router;
