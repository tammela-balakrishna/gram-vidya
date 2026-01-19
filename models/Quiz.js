// models/Quiz.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: Number, required: true } // index of correct option
 // optional for auto-grading
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: { type: [questionSchema], required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Quiz", quizSchema);
