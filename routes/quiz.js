import express from "express";
import Joi from "joi";
import Quiz from "../models/Quiz.js";
import StudentQuiz from "../models/StudentQuiz.js";
import { verifyAdmin, verifyStudent } from "../middleware/auth.js";

const router = express.Router();

// ---------------- Validation schema ----------------
const quizSchema = Joi.object({
  title: Joi.string().min(3).required(),
  questions: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().required(),
        options: Joi.array().items(Joi.string()).min(2).required(),
        answer: Joi.number().required(),
      })
    )
    .min(1)
    .required(),
});

// ---------------- Admin: Create new quiz ----------------
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { error } = quizSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const newQuiz = await Quiz.create(req.body);
    res.status(201).json({ message: "Quiz created successfully", quiz: newQuiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Get all quizzes ----------------
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find({}, "-__v");
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Student: Submit quiz ----------------
router.post("/:id/submit", verifyStudent, async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;
    const { answers } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const existing = await StudentQuiz.findOne({ studentId, quizId: id });
    if (existing) return res.status(400).json({ error: "Quiz already submitted" });

   let score = 0;

const formattedAnswers = quiz.questions.map((q, idx) => {
  const selectedOptionIndex = answers[idx] !== undefined ? answers[idx] : null;
  const selectedOptionText =
    selectedOptionIndex !== null ? q.options[selectedOptionIndex] : null;

  // Compare index with q.answer (ensure types match)
  if (
    selectedOptionIndex !== null &&
    selectedOptionText === q.options[q.answer]
  ) {
    score++;
  }

  return {
    questionIndex: idx,
    selectedOptionIndex,
    selectedOptionText,
  };
});

await StudentQuiz.create({
  studentId,
  quizId: id,
  answers: formattedAnswers,
  score,
});


    res.json({ message: "Quiz submitted successfully", score, total: quiz.questions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
