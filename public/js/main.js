// main.js
window.token = localStorage.getItem("token");

if (!window.token) {
  window.location.href = "index.html"; // redirect if not logged in
}

// If you need role-specific checks:
window.adminToken = localStorage.getItem("adminToken");
window.studentToken = localStorage.getItem("studentToken");

window.socket = io("http://localhost:5000", {
  auth: { token: window.token }
});
