$(document).ready(function () {
    const authUser = localStorage.getItem("authUser");

    if (!authUser) {
        window.location.href = "auth.html";
    }
})