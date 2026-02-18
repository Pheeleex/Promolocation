$(document).ready(function () {
  const authUser = localStorage.getItem("authUser");

    if (!authUser) {
        window.location.href = "Auth.html";
    }

  const incidentHistory = [
    {
      name: "John Doe",
      userId: "PRM001",
      email: "johndoe@email.com",
      image: "assets/test1.png",
      issue: "Late Arrival",
      role: "Brand Ambassador",
      location: "Ikeja, Lagos",
      description: "Arrived 2 hours late to assigned promotional location.",
      date: "2026-02-10",
      status: "Pending",
    },
    {
      name: "Jane Smith",
      userId: "PRM002",
      email: "janesmith@email.com",
      image: "assets/test2.png",
      issue: "Uniform Violation",
      role: "Sales Manager",
      location: "Koroloy, Moscow",
      description: "Not dressed according to company uniform policy.",
      date: "2026-02-11",
      status: "In Progress",
    },
    {
      name: "Michael Brown",
      userId: "PRM003",
      email: "michaelbrown@email.com",
      image:"assets/test1.png",
      issue: "Customer Complaint",
      role: "Location Manager",
      location: "Ikeja, Lagos",
      description: "Customer reported unprofessional behavior during engagement.",
      date: "2026-02-12",
      status: "Resolved",
    },
    {
      name: "Sarah Wilson",
      userId: "PRM004",
      email: "sarahwilson@email.com",
      image: "assets/test3.png",
      issue: "Absenteeism",
      role: "Brand Ambassador",
      location: "Koroloy, Moscow",
      description: "Absent from assigned duty without prior notice.",
      date: "2026-02-13",
      status: "Closed",
    },
  ];

  const table = $("#promotersTable").DataTable({
    data: incidentHistory,
    dom: "t",
    pageLength: 10,
    columns: [
      {
        data: "name",
        render: (data, type, row) => `
          <div class="name-column">
            <strong class="user-name">${data}</strong>
            <span class="email-sub">${row.email}</span>
          </div>`,
      },
      { data: "userId" },
      { data: "issue" },
      { data: "role" },
      { data: "location" },
      {
        data: "date",
        render: function (data, type) {
          if (type === "display") {
            const date = new Date(data);
            const day = date.getDate();
            const month = date.toLocaleString("default", { month: "long" });
            const year = date.getFullYear();
            function getOrdinal(n) {
              if (n > 3 && n < 21) return "th";
              switch (n % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
              }
            }
            return `${day}${getOrdinal(day)} ${month}, ${year}`;
          }
          return data;
        },
      },
      {
        data: "status",
        render: (data) => {
          const statusColors = {
            Resolved: "#16A34A",
            Closed: "#DC2626",
            "In Progress": "#2563EB",
            Pending: "#EAB308",
          };
          const color = statusColors[data] || "#6B7280";
          return `<span style="background-color:${color}20;color:${color};padding:6px 12px;border-radius:20px;font-weight:600;font-size:13px;display:inline-block;">${data}</span>`;
        },
      },
      {
        data: null,
        orderable: false,
        className: "dt-center",
        render: function () {
          return `<div class="action-icons"><button class="view-button">View</button></div>`;
        },
      },
    ],
  });

  // View button — save record to localStorage and navigate to detail page
  $("#promotersTable").on("click", ".view-button", function () {
    const rowData = table.row($(this).parents("tr")).data();
    localStorage.setItem("incidentDetail", JSON.stringify(rowData));
    window.location.href = "IncidentDetail.html";
  });

  // Search
  $("#customSearch").on("keyup", function () {
    table.search(this.value).draw();
  });

  // Pagination
  function updateUI() {
    const info = table.page.info();
    $("#pageIndicator").text(`${info.page + 1} of ${info.pages}`);
    $("#prevPage, #previousPageBtn").toggle(info.page !== 0);
    $("#nextPageTrigger, #nextPageBtn").toggle(info.page !== info.pages - 1);
  }

  $("#nextPageBtn, #nextPageTrigger").on("click", () => { table.page("next").draw("page"); updateUI(); });
  $("#prevPage, #previousPageBtn").on("click", () => { table.page("previous").draw("page"); updateUI(); });

  updateUI();
});