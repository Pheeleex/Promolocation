function openLogoutModal() {
  document.getElementById("logoutOverlay").classList.add("active");
}

function closeLogoutModal() {
  document.getElementById("logoutOverlay").classList.remove("active");
}

function confirmLogout() {
  localStorage.removeItem("authUser");
  window.location.href = "index.html"; // change to your login page
}

// Close on backdrop click
document
  .getElementById("logoutOverlay")
  .addEventListener("click", function (e) {
    if (e.target === this) closeLogoutModal();
  });

// Close on Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeLogoutModal();
});
