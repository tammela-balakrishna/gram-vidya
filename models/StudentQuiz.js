import mongoose from "mongoose";

const studentQuizSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  answers: [
    {
      questionIndex: { type: Number, required: true }, // index of question in quiz
      selectedOptionIndex: { type: Number, required: true },
      selectedOptionText: { type: String, required: true }
    }
  ],
  score: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const StudentQuiz = mongoose.models.StudentQuiz || mongoose.model("StudentQuiz", studentQuizSchema);
export default StudentQuiz;