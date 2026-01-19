const quizForm = document.getElementById("quizForm");
const questionsContainer = document.getElementById("questionsContainer");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const quizMessage = document.getElementById("quizMessage");

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
      <div class="optionWrapper flex gap-2">
        <input type="text" class="optionInput border border-gray-300 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" placeholder="Option 1" required />
        <button type="button" class="deleteOptionBtn px-2 bg-red-500 text-white rounded hover:bg-red-600 transition">✕</button>
      </div>
      <div class="optionWrapper flex gap-2">
        <input type="text" class="optionInput border border-gray-300 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" placeholder="Option 2" required />
        <button type="button" class="deleteOptionBtn px-2 bg-red-500 text-white rounded hover:bg-red-600 transition">✕</button>
      </div>
    </div>

    <button type="button" class="addOptionBtn mt-3 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition">➕ Add Option</button>

    <label class="block text-gray-700 font-medium mt-4 mb-2">Correct Answer</label>
    <select class="answerInput border border-gray-300 px-3 py-2 rounded-lg w-36 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"></select>
  `;

  const optionsContainer = qDiv.querySelector(".optionsContainer");
  const answerSelect = qDiv.querySelector(".answerInput");

  // Function to refresh correct answer options
  function updateAnswerOptions() {
    const options = optionsContainer.querySelectorAll(".optionInput");
    answerSelect.innerHTML = "";
    options.forEach((opt, i) => {
      const optionEl = document.createElement("option");
      optionEl.value = i;
      optionEl.textContent = opt.value || `Option ${i + 1}`;
      answerSelect.appendChild(optionEl);
    });
  }

  // Add new option
  qDiv.querySelector(".addOptionBtn").addEventListener("click", () => {
    const optWrapper = document.createElement("div");
    optWrapper.classList.add("optionWrapper", "flex", "gap-2");

    const optInput = document.createElement("input");
    optInput.type = "text";
    optInput.placeholder = `Option ${optionsContainer.querySelectorAll(".optionInput").length + 1}`;
    optInput.classList.add("optionInput", "border", "border-gray-300", "px-3", "py-2", "rounded-lg", "w-full", "focus:ring-2", "focus:ring-blue-400", "focus:border-blue-400", "transition");

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "✕";
    delBtn.classList.add("deleteOptionBtn", "px-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-600", "transition");

    // Delete option
    delBtn.addEventListener("click", () => {
      optWrapper.remove();
      updateAnswerOptions();
    });

    optInput.addEventListener("input", updateAnswerOptions);

    optWrapper.appendChild(optInput);
    optWrapper.appendChild(delBtn);
    optionsContainer.appendChild(optWrapper);
    updateAnswerOptions();
  });

  // Initial delete buttons
  qDiv.querySelectorAll(".deleteOptionBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      btn.parentElement.remove();
      updateAnswerOptions();
    });
  });

  // Update answer select on input change
  qDiv.querySelectorAll(".optionInput").forEach((opt) => {
    opt.addEventListener("input", updateAnswerOptions);
  });

  updateAnswerOptions(); // initial options
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
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
