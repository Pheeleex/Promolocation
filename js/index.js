const logoutOverlay = document.getElementById("logoutOverlay");

function setMobileSidebarOpen(isOpen) {
  document.body.classList.toggle("sidebar-open", isOpen);

  const toggleButton = document.querySelector(".mobile-nav-toggle");

  if (toggleButton) {
    toggleButton.setAttribute("aria-expanded", String(isOpen));
  }
}

function closeMobileSidebar() {
  setMobileSidebarOpen(false);
}

function openLogoutModal() {
  closeMobileSidebar();

  if (logoutOverlay) {
    logoutOverlay.classList.add("active");
  }
}

function closeLogoutModal() {
  if (logoutOverlay) {
    logoutOverlay.classList.remove("active");
  }
}

function confirmLogout() {
  localStorage.removeItem("authUser");
  window.location.href = "index.html"; // change to your login page
}

function initializeMobileSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");
  const pageContainer = document.querySelector(".page-container");

  if (!sidebar || !mainContent || !pageContainer) {
    return;
  }

  document.body.classList.add("has-sidebar");

  if (!sidebar.id) {
    sidebar.id = "appSidebar";
  }

  if (!mainContent.querySelector(".mobile-nav-toggle")) {
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "mobile-nav-toggle";
    toggleButton.setAttribute("aria-label", "Open navigation menu");
    toggleButton.setAttribute("aria-controls", sidebar.id);
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.innerHTML = `
      <span class="mobile-nav-toggle-icon" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span class="mobile-nav-toggle-text">Menu</span>
    `;

    mainContent.insertBefore(toggleButton, mainContent.firstChild);

    toggleButton.addEventListener("click", function () {
      setMobileSidebarOpen(!document.body.classList.contains("sidebar-open"));
    });
  }

  if (!sidebar.querySelector(".mobile-sidebar-close")) {
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "mobile-sidebar-close";
    closeButton.setAttribute("aria-label", "Close navigation menu");
    closeButton.textContent = "Close";

    sidebar.insertBefore(closeButton, sidebar.firstChild);
    closeButton.addEventListener("click", closeMobileSidebar);
  }

  if (!pageContainer.querySelector(".sidebar-backdrop")) {
    const backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    pageContainer.appendChild(backdrop);
    backdrop.addEventListener("click", closeMobileSidebar);
  }

  sidebar.querySelectorAll("a, .logout-link").forEach(function (control) {
    control.addEventListener("click", closeMobileSidebar);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 600) {
      closeMobileSidebar();
    }
  });
}

if (logoutOverlay) {
  logoutOverlay.addEventListener("click", function (e) {
    if (e.target === this) {
      closeLogoutModal();
    }
  });
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeLogoutModal();
    closeMobileSidebar();
  }
});

initializeMobileSidebar();
