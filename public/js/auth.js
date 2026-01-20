document.addEventListener("DOMContentLoaded", () => {
  const apiBase = window.API_BASE || "";
  // ----- LOGIN -----
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginMessage.textContent = "";

      const form = e.target;
      const email = form.email.value.trim();
      const password = form.password.value;

      try {
        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        // Save token and role
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        // Redirect based on role
        if (data.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          window.location.href = "student-dashboard.html";
        }
      } catch (err) {
        loginMessage.textContent = err.message;
      }
    });
  }

  // ----- LOGOUT -----
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    // Add Tailwind classes for styling the logout button
    logoutBtn.classList.add(
      "bg-red-500",
      "hover:bg-red-600",
      "text-white",
      "font-bold",
      "py-2",
      "px-4",
      "rounded",
      "transition",
      "duration-300"
    );

    logoutBtn.addEventListener("click", () => {
      // Clear all relevant authentication items from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      // The following can be deprecated if no other part of the application uses them
      localStorage.removeItem("adminToken"); 
      localStorage.removeItem("studentToken");
      window.location.href = "index.html"; // Redirect to the login page
    });
  }
});
