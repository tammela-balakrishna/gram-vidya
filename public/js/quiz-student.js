const quizContainer = document.getElementById("quizContainer");
const studentToken = localStorage.getItem("token"); // student token

if (!studentToken) {
  quizContainer.innerHTML =
    "<p class='text-red-500 text-lg font-semibold text-center'>You must be logged in as a student to view quizzes</p>";
}

// -------- Safe fetch with token and role error handling --------
async function fetchWithToken(url, options = {}) {
  if (!studentToken) throw new Error("No student token found");

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${studentToken}`,
  };

  try {
    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
      // Handle role-based error gracefully
      if (res.status === 403 && data.error?.toLowerCase().includes("students only")) {
        throw new Error("Access denied: You must be logged in as a student to view this content.");
      } else {
        throw new Error(data.error || "Server error");
      }
    }

    return data;
  } catch (err) {
    // Network errors or JSON parsing errors
    throw new Error(err.message || "Failed to fetch data from server");
  }
}

// -------- Load quizzes safely --------
async function loadQuizzes() {
  if (!studentToken) return;

  try {
    const quizzes = await fetchWithToken("http://localhost:5000/api/quiz");
    const submissions = await fetchWithToken("http://localhost:5000/api/student-quiz");

    const submissionMap = {};
    submissions.forEach((sub) => (submissionMap[sub.quizId._id] = sub));

    quizContainer.innerHTML = "";

    quizzes.forEach((quiz) => {
      const quizCard = document.createElement("div");
      quizCard.classList.add(
        "border",
        "p-6",
        "mb-6",
        "rounded-xl",
        "bg-white",
        "shadow-md",
        "hover:shadow-xl",
        "transition-shadow",
        "duration-300"
      );

      // Title container
      const titleDiv = document.createElement("div");
      titleDiv.textContent = quiz.title;
      titleDiv.classList.add(
        "text-xl",
        "font-bold",
        "text-gray-800",
        "cursor-pointer",
        "hover:text-blue-600",
        "transition-colors",
        "duration-200"
      );
      quizCard.appendChild(titleDiv);

      // Questions container
      const questionContainer = document.createElement("div");
      questionContainer.classList.add("mt-4", "space-y-4", "hidden");

      const studentSubmission = submissionMap[quiz._id];
      const isSubmitted = !!studentSubmission;

      quiz.questions.forEach((q, index) => {
        const card = document.createElement("div");
        card.className =
          "mb-4 p-4 border rounded-lg shadow-sm bg-white text-sm sm:text-base";

        const title = document.createElement("h3");
        title.className = "font-semibold mb-2";
        title.textContent = `Q${index + 1}. ${q.question}`;
        card.appendChild(title);

        q.options.forEach((opt, optIndex) => {
          const label = document.createElement("label");
          label.className = "flex items-center space-x-2 mb-1 cursor-pointer";

          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = `q-${q._id}`;
          radio.value = optIndex;

          const span = document.createElement("span");
          span.textContent = opt;

          label.appendChild(radio);
          label.appendChild(span);
          card.appendChild(label);
        });

        questionContainer.appendChild(card);
      });

      // Submit button or info
      if (!isSubmitted) {
        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit Quiz";
        submitBtn.classList.add(
          "bg-red-500",
          "hover:bg-blue-700",
          "text-white",
          "font-semibold",
          "py-2",
          "px-5",
          "rounded-lg",
          "shadow-md",
          "transition",
          "duration-300",
          "mt-3"
        );

        submitBtn.addEventListener("click", async () => {
          const answers = {};
          quiz.questions.forEach((q, idx) => {
            const selected = document.querySelector(`input[name="q-${q._id}"]:checked`);
            if (selected) {
              answers[idx] = parseInt(selected.value, 10);
            }
          });

          if (Object.keys(answers).length === 0) {
            alert("Please select at least one answer!");
            return;
          }

          try {
            const data = await fetchWithToken(
              `http://localhost:5000/api/quiz/${quiz._id}/submit`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers }),
              }
            );

            alert(`Quiz submitted! Score: ${data.score}/${data.total}`);

            // RESET: clear all selected radios in this quiz
            const radios = quizCard.querySelectorAll('input[type="radio"]');
            radios.forEach((r) => {
              r.checked = false;
            });

            // Reload quizzes so this one shows as submitted (and buttons/score update)
            loadQuizzes();
          } catch (err) {
            console.error(err);
            alert(err.message);
          }
        });

        questionContainer.appendChild(submitBtn);
      } else {
        const info = document.createElement("p");
        info.textContent = `Already submitted! Score: ${studentSubmission.score}/${quiz.questions.length}`;
        info.classList.add(
          "text-gray-600",
          "italic",
          "mt-3",
          "bg-gray-100",
          "p-3",
          "rounded-md"
        );
        questionContainer.appendChild(info);
      }

      quizCard.appendChild(questionContainer);

      // Toggle questions visibility on title click
      titleDiv.addEventListener("click", () => {
        questionContainer.classList.toggle("hidden");
      });

      quizContainer.appendChild(quizCard);
    });
  } catch (err) {
    console.error(err);
    quizContainer.innerHTML = `<p class='text-red-500 text-lg font-semibold text-center'>${err.message}</p>`;
  }
}

loadQuizzes();
