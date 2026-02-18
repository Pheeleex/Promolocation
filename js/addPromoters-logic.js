$(document).ready(function () {
  const authUser = localStorage.getItem("authUser");

  if (!authUser) {
    window.location.href = "auth.html";
  }

  const statusToggle = document.getElementById("statusToggle");
  const statusLabel = document.getElementById("statusLabel");

  // Set initial state
  if (statusToggle.checked) {
    statusLabel.textContent = "Deactivate";
  } else {
    statusLabel.textContent = "Activate";
  }

  // Listen for changes
  statusToggle.addEventListener("change", function () {
    if (this.checked) {
      statusLabel.textContent = "Deactivate";
    } else {
      statusLabel.textContent = "Activate";
    }
  });




    $("#addPromoterForm").on("submit", function (e) {
        e.preventDefault();

        let missingFields = [];

        // Select required inputs + selects
        const requiredFields = $(this).find("input[required], select[required]");

        // Remove previous error styling
        requiredFields.removeClass("input-error");

        requiredFields.each(function () {
            const value = $(this).val();

            if (!value || !value.trim()) {
                $(this).addClass("input-error");

                const labelText = $(this)
                    .closest(".form-group")
                    .find("label")
                    .text()
                    .replace("*", "")
                    .trim();

                missingFields.push(labelText);
            }
        });

        if (missingFields.length > 0) {
            Swal.fire({
                icon: "error",
                title: "Missing Required Fields",
                html: `
                    <ul style="text-align:left;">
                        ${missingFields.map(field => `<li>${field}</li>`).join("")}
                    </ul>
                `,
                confirmButtonColor: "#d33"
            });
            return;
        }

        // Success
        Swal.fire({
            icon: "success",
            title: "Promoter Added Successfully!",
            confirmButtonColor: "#22c55e"
        });

        this.reset();
    });



});
