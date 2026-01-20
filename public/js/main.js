// main.js
window.token = localStorage.getItem("token");

if (!window.token) {
  window.location.href = "index.html"; // redirect if not logged in
}

// If you need role-specific checks:
window.adminToken = localStorage.getItem("adminToken");
window.studentToken = localStorage.getItem("studentToken");

const API_BASE = window.API_BASE || "";
window.socket = API_BASE ? io(API_BASE, { auth: { token: window.token } }) : io({ auth: { token: window.token } });
