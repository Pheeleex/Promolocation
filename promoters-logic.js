$(document).ready(function () {
  const promoters = [
    {
      name: "Emmanuel Raphael",
      email: "Emmy@gmail.com",
      userId: "12345",
      role: "Sales Manager",
      region: "Africa, Nigeria",
      location: "Ikeja, Lagos",
      status: "Active",
    },
    {
      name: "Maggy Edozie",
      email: "MaggyEdozie@gmail.com",
      userId: "12345",
      role: "Location Manager",
      region: "Africa, Ghana",
      location: "Tema, Accra",
      status: "Active",
    },
    {
      name: "Habeeb Siaka",
      email: "HabeebSiaka@gmail.com",
      userId: "12345",
      role: "Sales Manager",
      region: "Europe, Russia",
      location: "Khimki, Moscow",
      status: "Active",
    },
    {
      name: "Omololu Jumat",
      email: "OmololuJumat@gmail.com",
      userId: "12345",
      role: "Location Manager",
      region: "Europe, Russia",
      location: "Korolyov, Moscow",
      status: "Inactive",
    },
  ];

  const table = $("#promotersTable").DataTable({
    data: promoters,
    dom: "t",
    pageLength: 10,
    columns: [
      {
        data: "name",
        render: (data, type, row) =>
          `<strong>${data}</strong><span class="email-sub">${row.email}</span>`,
      },
      { data: "userId" },
      { data: "role" },
      { data: "region" },
      { data: "location" },
      {
        data: "status",
        render: (data) => {
          const color = data === "Active" ? "#22C55E" : "#EF4444";
          return `<span style="color: ${color}; font-weight: 700;">${data}</span>`;
        },
      },
      {
        data: null, // Actions column
        orderable: false, // Disable sorting for icons
        className: "dt-center",
        render: function (data, type, row) {
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

  // Custom Search
  $("#customSearch").on("keyup", function () {
    table.search(this.value).draw();
  });

  // Pagination Logic
  function updateUI() {
    const info = table.page.info();
    $("#pageIndicator").text(`${info.page + 1} of ${info.pages}`);
  }

  $("#nextPageBtn, #nextPageTrigger").on("click", () => {
    table.page("next").draw("page");
    updateUI();
  });
  $("#prevPage").on("click", () => {
    table.page("previous").draw("page");
    updateUI();
  });
});
