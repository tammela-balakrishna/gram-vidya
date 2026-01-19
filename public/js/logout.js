// // Get tokens from localStorage
// window.token = localStorage.getItem("token");
// window.adminToken = localStorage.getItem("adminToken");
// window.studentToken = localStorage.getItem("studentToken");
// window.role = localStorage.getItem("role");

// // Redirect if not logged in
// if (!window.token) {
//   window.location.href = "/index.html";
// }

// // Example: socket authentication
// if (window.token) {
//   window.socket = io({
//     auth: { token: window.token }
//   });
// }
