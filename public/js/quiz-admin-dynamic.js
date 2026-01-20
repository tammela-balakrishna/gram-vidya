const quizForm = document.getElementById("quizForm");
const questionsContainer = document.getElementById("questionsContainer");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const quizMessage = document.getElementById("quizMessage");
const token = window.token || localStorage.getItem("token");
// API base - use backend directly to avoid dev-server origin issues
const API_BASE = window.API_BASE || "";

// ---------------- Add new question block ----------------
function addQuestion() {
  const idx = questionsContainer.children.length;
  const qDiv = document.createElement("div");
  qDiv.classList.add("mb-6", "p-4", "rounded-xl", "border", "border-gray-200", "bg-gray-50", "shadow-sm");

  qDiv.innerHTML = `
    <label class="block text-gray-800 font-semibold mb-2">Question ${idx + 1}</label>
    <input type="text" class="questionText border border-gray-300 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition mb-4" placeholder="Enter your question..." required />

    <label class="block text-gray-700 font-medium mb-2">Options</label>
    <div class="optionsContainer space-y-2">
      <input type="text" class="optionInput border border-gray-300 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" placeholder="Option 1" required />
      <input type="text" class="optionInput border border-gray-300 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" placeholder="Option 2" required />
    </div>

    <button type="button" class="addOptionBtn mt-3 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition">
      ➕ Add Option
    </button>

    <label class="block text-gray-700 font-medium mt-4 mb-2">Correct Answer (0-based index)</label>
    <input type="number" class="answerInput border border-gray-300 px-3 py-2 rounded-lg w-24 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition" min="0" value="0" required />
  `;

  // Add option dynamically
  qDiv.querySelector(".addOptionBtn").addEventListener("click", () => {
    const optionsContainer = qDiv.querySelector(".optionsContainer");
    const optionCount = optionsContainer.querySelectorAll(".optionInput").length;
    const optInput = document.createElement("input");
    optInput.type = "text";
    optInput.placeholder = `Option ${optionCount + 1}`;
    optInput.classList.add("optionInput", "border", "border-gray-300", "px-3", "py-2", "rounded-lg", "w-full", "focus:ring-2", "focus:ring-blue-400", "focus:border-blue-400", "transition");
    optionsContainer.appendChild(optInput);
  });

  questionsContainer.appendChild(qDiv);
}

// Initially add one question
addQuestion();

// Add question button
addQuestionBtn.addEventListener("click", addQuestion);

// ---------------- Submit quiz form ----------------
quizForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("quizTitle").value.trim();
  const questionsDivs = questionsContainer.children;
  const questions = [];

  for (let qDiv of questionsDivs) {
    const questionText = qDiv.querySelector(".questionText").value.trim();
    const options = Array.from(qDiv.querySelectorAll(".optionInput")).map(o => o.value.trim());
    const answer = parseInt(qDiv.querySelector(".answerInput").value);

    if (!questionText || options.length < 2 || options.some(o => !o)) {
      quizMessage.textContent = "❗ Please fill all fields and have at least 2 options per question.";
      quizMessage.className = "text-red-500 mt-3 font-medium";
      return;
    }

    questions.push({ question: questionText, options, answer });
  }

  try {
    const res = await fetch(`${API_BASE}/api/quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: JSON.stringify({ title, questions }),
    });

    const data = await res.json();

    if (res.ok) {
      quizMessage.textContent = "✅ Quiz created successfully!";
      quizMessage.className = "text-green-600 mt-3 font-semibold";
      quizForm.reset();
      questionsContainer.innerHTML = "";
      addQuestion();
    } else {
      quizMessage.textContent = data.error || "❌ Failed to create quiz";
      quizMessage.className = "text-red-500 mt-3 font-medium";
    }
  } catch (err) {
    console.error(err);
    quizMessage.textContent = "⚠️ Server error";
    quizMessage.className = "text-red-500 mt-3 font-medium";
  }
});
