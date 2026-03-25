$(document).ready(function () {
  const authUser = localStorage.getItem("authUser");

    if (!authUser) {
        window.location.href = "auth.html";
    }

  const incidentHistory = [
    {
      name: "John Doe",
      userId: "PRM001",
      email: "johndoe@email.com",
      image: "assets/test1.png",
      issue: "Late Arrival",
      location: "Berlin",
      description: "Arrived 2 hours late to assigned promotional duty.",
      date: "2026-02-10",
      status: "Pending",
    },
    {
      name: "Jane Smith",
      userId: "PRM002",
      email: "janesmith@email.com",
      image: "assets/test2.png",
      issue: "Uniform Violation",
      location: "Munich",
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
      location: "Hamburg",
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
      location: "Cologne",
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
  function getVisiblePages(currentPage, totalPages) {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index);
    }

    if (currentPage <= 2) {
      return [0, 1, 2, 3, "...", totalPages - 1];
    }

    if (currentPage >= totalPages - 3) {
      return [0, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1];
    }

    return [0, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages - 1];
  }

  function updateUI() {
    const info = table.page.info();
    const totalPages = Math.max(info.pages, 1);
    const currentPage = Math.min(info.page, totalPages - 1);
    const visiblePages = getVisiblePages(currentPage, totalPages);
    const paginationMarkup = visiblePages
      .map((page) => {
        if (page === "...") {
          return '<span class="pagination-ellipsis" aria-hidden="true">...</span>';
        }

        const isActive = page === currentPage;
        return `
          <button
            type="button"
            class="pagination-button${isActive ? " is-active" : ""}"
            data-page="${page}"
            ${isActive ? 'aria-current="page"' : ""}
          >
            ${page + 1}
          </button>`;
      })
      .join("");

    $("#paginationNav").html(`
      <button
        type="button"
        class="pagination-arrow"
        data-direction="previous"
        aria-label="Previous page"
        ${currentPage === 0 ? "disabled" : ""}
      >
        &lt;
      </button>
      <div class="pagination-pages">${paginationMarkup}</div>
      <button
        type="button"
        class="pagination-arrow"
        data-direction="next"
        aria-label="Next page"
        ${currentPage >= totalPages - 1 ? "disabled" : ""}
      >
        &gt;
      </button>
    `);
  }

  $("#paginationNav").on("click", "[data-page]", function () {
    table.page(Number($(this).data("page"))).draw("page");
  });
  $("#paginationNav").on("click", "[data-direction]", function () {
    const direction = $(this).data("direction");
    table.page(direction).draw("page");
  });

  table.on("draw", updateUI);
  updateUI();
});
