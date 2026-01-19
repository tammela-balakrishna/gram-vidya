document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("dropZone");
  const pdfInput = document.getElementById("pdfInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const progressBar = document.getElementById("progressBar");
  const pdfPreview = document.getElementById("pdfPreview");
  const uploadMessage = document.getElementById("uploadMessage");

  if (!dropZone || !pdfInput || !uploadBtn || !pdfPreview || !uploadMessage) {
    console.warn("pdf-upload: missing required DOM elements; script will not initialize.");
    return;
  }

  let selectedFile = null;
  const token = window.token || localStorage.getItem("token");

  // Drag & drop
  dropZone.addEventListener("click", () => pdfInput.click());
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("border-2", "border-dashed", "border-blue-400", "bg-blue-50", "shadow-sm", "scale-105", "transition", "duration-200", "ease-in-out");
  });
  dropZone.addEventListener("dragleave", e => {
    e.preventDefault();
    dropZone.classList.remove("border-blue-400", "bg-blue-50", "shadow-sm", "scale-105");
  });
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("border-blue-400", "bg-blue-50", "shadow-sm", "scale-105");
    selectedFile = e.dataTransfer.files[0];
    showPreview(selectedFile);
  });
  pdfInput.addEventListener("change", e => {
    selectedFile = e.target.files[0];
    showPreview(selectedFile);
  });

  function showPreview(file) {
    if (!file) return;
    pdfPreview.innerHTML = `
      <li class="flex items-center justify-between p-3 border border-gray-200 rounded-lg mb-2 bg-gray-50 shadow-sm hover:bg-gray-100 transition duration-200">
        <span class="font-medium text-gray-800 truncate max-w-[70%]">${file.name}</span>
        <span class="text-xs text-gray-500">${(file.size / 1024).toFixed(2)} KB</span>
      </li>
    `;
  }

  // Upload PDF
  uploadBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      uploadMessage.textContent = "❗ Please select a PDF first!";
      uploadMessage.className = "mt-2 text-sm font-medium text-red-500";
      return;
    }

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      uploadBtn.disabled = true;
      uploadMessage.textContent = "Uploading...";
      uploadMessage.className = "mt-2 text-sm font-medium text-gray-700";

      // Determine API base:
      // - honor `window.API_BASE` if explicitly set
      // - if the page is served from a dev server (e.g. port 3000), default to backend on port 5000
      // - otherwise use relative path (same origin)
      const detectApiBase = () => {
        if (window.API_BASE) return window.API_BASE;
        try {
          const host = location.hostname;
          const port = location.port;
          if ((host === 'localhost' || host === '127.0.0.1') && port && port !== '5000') {
            return `${location.protocol}//${host}:5000`;
          }
        } catch (e) {
          /* ignore */
        }
        return ""; // relative
      };
      const apiBase = detectApiBase();
      const url = apiBase + "/api/pdf/upload"; // ✅ correct

      console.debug('[pdf-upload] POST', url);
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      console.debug('[pdf-upload] response status', res.status, res.headers.get('content-type'));

      let data = null;
      // If server returned JSON, parse it. Otherwise capture raw text for debugging.
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (parseErr) {
          console.error('[pdf-upload] JSON parse error', parseErr);
          const raw = await res.text();
          console.debug('[pdf-upload] raw response:', raw);
          data = { error: 'Invalid JSON response', raw };
        }
      } else {
        const raw = await res.text();
        console.warn('[pdf-upload] non-JSON response received');
        console.debug('[pdf-upload] raw response:', raw);
        data = { error: 'Invalid server response', raw };
      }

      if (res.ok) {
        uploadMessage.textContent = data.message || 'Upload successful';
        uploadMessage.className = "mt-2 text-sm font-semibold text-green-600";
        const pdfName = (data.pdf && (data.pdf.originalname || data.pdf.name)) || 'PDF';
        const pdfUrl = data.pdf && (data.pdf.url || data.pdf.path) || '#';
        pdfPreview.innerHTML = `<a href="${pdfUrl}" target="_blank" class="text-blue-600 underline">${pdfName}</a>`;
      } else {
        uploadMessage.textContent =
          (data && data.error) || "⚠️ Upload failed. Network error.";
        uploadMessage.className = "mt-2 text-sm font-medium text-red-500";
      }

      selectedFile = null;
      pdfInput.value = "";
    } catch (err) {
      console.error(err);
      uploadMessage.textContent = "⚠️ Upload failed. Network error.";
      uploadMessage.className = "mt-2 text-sm font-medium text-red-500";
    } finally {
      uploadBtn.disabled = false;
    }
  });
});
