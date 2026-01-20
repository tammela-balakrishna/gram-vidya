const pdfList = document.getElementById("pdfList");
const apiBase = window.API_BASE || "";
const token = window.token || localStorage.getItem("token");

async function loadPDFs() {
  // 1️⃣ Check token BEFORE making request
  if (!token) {
    alert("Login required");
    window.location.href = "/index.html";
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
    }

    const raw = await res.json();
    console.log("PDFs from API:", raw);

    const pdfs = Array.isArray(raw) ? raw.filter((p) => p && p._id) : [];
    pdfList.innerHTML = "";

    if (!pdfs.length) {
      pdfList.innerHTML = `<p class="text-gray-500 text-center py-6">No PDFs available yet.</p>`;
      return;
    }

    pdfs.forEach((pdf) => {
      const label = pdf.originalname || pdf.name || "PDF";

      const li = document.createElement("li");
      li.className =
        "mb-2 border p-2 rounded hover:bg-gray-100 flex justify-between items-center";

      li.innerHTML = `
        <span class="truncate max-w-[60%] font-medium">${label}</span>
        <div class="flex gap-3">
          <button
            class="text-green-600 font-semibold underline hover:text-green-800"
            onclick="viewPDF('${pdf._id}')">
            View
          </button>

          <button
            class="text-blue-600 font-semibold underline hover:text-blue-800"
            onclick="downloadPDF('${pdf._id}', '${encodeURIComponent(label)}')">
            Download
          </button>
        </div>
      `;

      pdfList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading PDFs:", err);
    pdfList.innerHTML = `<p class="text-red-500 text-center py-6">Failed to load PDFs</p>`;
  }
}

// 2️⃣ Download via backend with Authorization header
async function downloadPDF(id, name) {
  if (!token) {
    alert("Login required");
    window.location.href = "/index.html";
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/pdf/download/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = decodeURIComponent(name) || "file.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download error:", err);
    alert("Failed to download PDF.");
  }
}

// 3️⃣ Initial load
loadPDFs();

async function viewPDF(id) {
  if (!token) {
    alert("Login required");
    window.location.href = "/index.html";
    return;
  }

  // Open directly in a new tab with the token in the query string (if your backend supports it)
  // OR fetch as blob and open. The fetch method is safer for auth headers but can be blocked by pop-up blockers.
  
  try {
    const res = await fetch(`${apiBase}/api/pdf/download/${id}?inline=true`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // If 401/403, token might be expired
      if (res.status === 401 || res.status === 403) {
         alert("Session expired. Please login again.");
         window.location.href = "/index.html";
         return;
      }
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    const newWindow = window.open(url, "_blank");
    if (!newWindow) {
        alert("Please allow pop-ups to view the PDF.");
    }
    
    // Clean up URL after a delay to allow the new tab to load
    setTimeout(() => URL.revokeObjectURL(url), 60000);

  } catch (err) {
    console.error("View error:", err);
    alert(`Failed to view PDF: ${err.message}`);
  }
}
