$(document).ready(function () {
  const authUser = localStorage.getItem("authUser");

  if (!authUser) {
    window.location.href = "auth.html";
  }
  // 1. DATA AND INITIALIZATION
  const promoters = [
    {
      userId: "12345",
      status: "Active",
    },
    {
      userId: "12346",
      status: "Active",
    },
    {
      userId: "12347",
      status: "Active",
    },
    {
      userId: "12348",
      status: "Inactive",
    },
    {
      userId: "12349",
      status: "Active",
    },
    {
      userId: "12350",
      status: "Active",
    },
    {
      userId: "12351",
      status: "Active",
    },
    {
      userId: "12352",
      status: "Inactive",
    },
    {
      userId: "12353",
      status: "Active",
    },
    {
      userId: "12354",
      status: "Active",
    },
    {
      userId: "12355",
      status: "Pending",
    },
    {
      userId: "12356",
      status: "Active",
    },
    {
      userId: "12357",
      status: "Active",
    },
    {
      userId: "12358",
      status: "Inactive",
    },
    {
      userId: "12359",
      status: "Active",
    },
    {
      userId: "12360",
      status: "Active",
    },
    {
      userId: "12361",
      status: "Active",
    },
    {
      userId: "12362",
      status: "Pending",
    },
    {
      userId: "12363",
      status: "Active",
    },
    {
      userId: "12364",
      status: "Active",
    },
    {
      userId: "12365",
      status: "Inactive",
    },
    {
      userId: "12366",
      status: "Active",
    },
    {
      userId: "12367",
      status: "Active",
    },
    {
      userId: "12368",
      status: "Pending",
    },
    {
      userId: "12369",
      status: "Active",
    },
    {
      userId: "12370",
      status: "Active",
    },
    {
      userId: "12371",
      status: "Active",
    },
    {
      userId: "12372",
      status: "Inactive",
    },
    {
      userId: "12373",
      status: "Active",
    },
  ];

  const table = $("#promotersTable").DataTable({
    data: promoters,
    dom: "t",
    pageLength: 10,
    columns: [
      { data: "userId" },
      {
        data: "status",
        render: (data) => {
          const color = data === "Active" ? "#22C55E" : "#EF4444";
          return `<span style="color: ${color}; font-weight: 700;">${data}</span>`;
        },
      },
      {
        data: null,
        orderable: false,
        className: "actions-column",
        render: function () {
          return `
            <div class="action-icons">
              <button class="icon-btn icon-edit" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-pen"><path d="M2 21a8 8 0 0 1 10.821-7.487"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="8" r="5"/></svg>
              </button>
              <button class="icon-btn icon-delete" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>`;
        },
      },
    ],
  });

  // 2. SEARCH & PAGINATION
  $("#customSearch").on("keyup", function () {
    table.search(this.value).draw();
  });

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

  // 3. EDIT LOGIC
  $("#promotersTable").on("click", ".icon-edit", function () {
    const rowData = table.row($(this).parents("tr")).data();

    $("#editId").val(rowData.userId);

    $("#editStatus").prop("checked", rowData.status === "Active");

    $("#editModal").fadeIn(200);
  });

  $(".close-modal").on("click", () => $("#editModal").fadeOut(200));

  $("#editPromoterForm").on("submit", function (e) {
    e.preventDefault();
    Swal.fire({
      icon: "success",
      title: "Promoter Updated Successfully!",
      confirmButtonColor: "#22c55e",
      timer: 2000,
      showConfirmButton: false,
    });
    $("#editModal").fadeOut(200);
  });

  // 4. DELETE LOGIC
  let rowToDelete = null;

  $("#promotersTable").on("click", ".icon-delete", function () {
    rowToDelete = $(this).parents("tr");
    $("#deleteModal").fadeIn(200);
  });

  $("#confirmDelete").on("click", function () {
    if (rowToDelete) {
      table.row(rowToDelete).remove().draw();
      rowToDelete = null;
      $("#deleteModal").fadeOut(200);
      updateUI();

      Swal.fire({
        icon: "success",
        title: "Promoter Deleted Successfully!",
        confirmButtonColor: "#22c55e",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  });

  $("#cancelDelete").on("click", () => $("#deleteModal").fadeOut(200));
});
