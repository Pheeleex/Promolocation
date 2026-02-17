(function () {

const authUser = localStorage.getItem("authUser");

    if (!authUser) {
        window.location.href = "auth.html";
    }

  const raw = localStorage.getItem("incidentDetail");

  if (!raw) {
    window.location.href = "history.html";
    return;
  }

  const d = JSON.parse(raw);

  // ── Ordinal date formatter ──────────────────────────────
  function formatDate(str) {
    const date = new Date(str);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    const suffix = (n) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th"; }
    };
    return `${day}${suffix(day)} ${month}, ${year}`;
  }

  // ── Status dot colors ───────────────────────────────────
  const statusDotColors = {
    "Active":      "#22C55E",
    "Resolved":    "#16A34A",
    "Closed":      "#DC2626",
    "In Progress": "#2563EB",
    "Pending":     "#EAB308",
    "Inactive":    "#94a3b8",
  };

  // ── Populate text fields ────────────────────────────────
  document.getElementById("detailName").textContent        = d.name        || "—";
  document.getElementById("detailEmail").textContent       = d.email       || "—";
  document.getElementById("detailUserId").textContent      = d.userId      || "—";
  document.getElementById("detailRole").textContent        = d.role        || "—";
  document.getElementById("detailLocation").textContent    = d.location    || "—";
  document.getElementById("detailIssue").textContent       = d.issue       || "—";
  document.getElementById("detailDescription").textContent = d.description || "—";
  document.getElementById("detailDate").textContent        = d.date ? formatDate(d.date) : "—";

  // ── Status: text + colored dot ──────────────────────────
  const statusText = d.status || "—";
  document.getElementById("detailStatusText").textContent = statusText;
  const dot = document.getElementById("detailStatusDot");
  const dotColor = statusDotColors[statusText];
  if (dotColor) dot.style.backgroundColor = dotColor;

  // ── Photo ───────────────────────────────────────────────
  const frame = document.getElementById("photoFrame");

  if (d.image) {
    const img = document.createElement("img");
    img.alt = d.name || "Incident photo";
    img.src = d.image;
    img.onerror = () => {
      frame.removeChild(img);
      showPhotoPlaceholder(frame);
    };
    frame.appendChild(img);
  } else {
    showPhotoPlaceholder(frame);
  }

  function showPhotoPlaceholder(el) {
    el.innerHTML = `
      <div class="photo-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
        <span>No photo available</span>
      </div>`;
  }
})();