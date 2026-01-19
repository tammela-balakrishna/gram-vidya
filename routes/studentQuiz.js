import express from "express";
import StudentQuiz from "../models/StudentQuiz.js";
import { verifyStudent } from "../middleware/auth.js";

const router = express.Router();

// Get quizzes submitted by this student
router.get("/", verifyStudent, async (req, res) => {
  try {
    const submissions = await StudentQuiz.find({ studentId: req.user._id })
      .populate("quizId", "title questions"); // include quiz title & questions

    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
