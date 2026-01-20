// public/js/config.js
// Central place to decide where the API & Socket.IO server live.
//
// Behavior:
// - Local dev: uses http://localhost:5000
// - GitHub Pages / custom domain (balatechts.me): uses https://api.balatechts.me
// - Same-origin deploy (e.g., Render hosting frontend+backend together): uses relative URLs

(function () {
  function computeApiBase() {
    if (typeof window !== "undefined" && window.API_BASE) return window.API_BASE;

    try {
      const host = window.location.hostname;

      if (host === "localhost" || host === "127.0.0.1") {
        return "http://localhost:5000";
      }

      // If you host the frontend on GitHub Pages or on balatechts.me,
      // point API calls to the backend subdomain.
      if (host.endsWith("github.io") || host === "balatechts.me" || host.endsWith(".balatechts.me")) {
        return "https://api.balatechts.me";
      }

      // Default: same origin (Render web service, etc.)
      return "";
    } catch (_e) {
      return "";
    }
  }

  window.API_BASE = computeApiBase();
})();
