$(document).ready(function () {
  const authUser = localStorage.getItem("authUser");

  if (!authUser) {
    window.location.href = "auth.html";
  }
  // 1. DATA AND INITIALIZATION
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
      userId: "12346",
      role: "Location Manager",
      region: "Africa, Ghana",
      location: "Tema, Accra",
      status: "Active",
    },
    {
      name: "Habeeb Siaka",
      email: "HabeebSiaka@gmail.com",
      userId: "12347",
      role: "Sales Manager",
      region: "Europe, Russia",
      location: "Khimki, Moscow",
      status: "Active",
    },
    {
      name: "Omololu Jumat",
      email: "OmololuJumat@gmail.com",
      userId: "12348",
      role: "Location Manager",
      region: "Europe, Russia",
      location: "Korolyov, Moscow",
      status: "Inactive",
    },
    {
      name: "Amara Diallo",
      email: "AmaraDiallo@gmail.com",
      userId: "12349",
      role: "Sales Manager",
      region: "Africa, Senegal",
      location: "Dakar, Dakar",
      status: "Active",
    },
    {
      name: "Chidi Okonkwo",
      email: "ChidiOkonkwo@gmail.com",
      userId: "12350",
      role: "Regional Director",
      region: "Africa, Nigeria",
      location: "Victoria Island, Lagos",
      status: "Active",
    },
    {
      name: "Fatima Al-Rashid",
      email: "FatimaAlRashid@gmail.com",
      userId: "12351",
      role: "Location Manager",
      region: "Middle East, UAE",
      location: "Deira, Dubai",
      status: "Active",
    },
    {
      name: "Yuki Tanaka",
      email: "YukiTanaka@gmail.com",
      userId: "12352",
      role: "Sales Manager",
      region: "Asia, Japan",
      location: "Shinjuku, Tokyo",
      status: "Inactive",
    },
    {
      name: "Priya Nambiar",
      email: "PriyaNambiar@gmail.com",
      userId: "12353",
      role: "Regional Director",
      region: "Asia, India",
      location: "Bandra, Mumbai",
      status: "Active",
    },
    {
      name: "Carlos Mendes",
      email: "CarlosMendes@gmail.com",
      userId: "12354",
      role: "Sales Manager",
      region: "South America, Brazil",
      location: "Copacabana, Rio de Janeiro",
      status: "Active",
    },
    {
      name: "Ingrid Solberg",
      email: "IngridSolberg@gmail.com",
      userId: "12355",
      role: "Location Manager",
      region: "Europe, Norway",
      location: "Grünerløkka, Oslo",
      status: "Pending",
    },
    {
      name: "Kwame Asante",
      email: "KwameAsante@gmail.com",
      userId: "12356",
      role: "Sales Manager",
      region: "Africa, Ghana",
      location: "Kumasi, Ashanti",
      status: "Active",
    },
    {
      name: "Sofia Esposito",
      email: "SofiaEsposito@gmail.com",
      userId: "12357",
      role: "Regional Director",
      region: "Europe, Italy",
      location: "Trastevere, Rome",
      status: "Active",
    },
    {
      name: "Dmitri Volkov",
      email: "DmitriVolkov@gmail.com",
      userId: "12358",
      role: "Location Manager",
      region: "Europe, Russia",
      location: "Saint Petersburg, Northwest",
      status: "Inactive",
    },
    {
      name: "Aisha Mwangi",
      email: "AishaMwangi@gmail.com",
      userId: "12359",
      role: "Sales Manager",
      region: "Africa, Kenya",
      location: "Westlands, Nairobi",
      status: "Active",
    },
    {
      name: "Liam O'Brien",
      email: "LiamOBrien@gmail.com",
      userId: "12360",
      role: "Sales Manager",
      region: "Europe, Ireland",
      location: "Ballsbridge, Dublin",
      status: "Active",
    },
    {
      name: "Mei Ling Chen",
      email: "MeiLingChen@gmail.com",
      userId: "12361",
      role: "Regional Director",
      region: "Asia, China",
      location: "Pudong, Shanghai",
      status: "Active",
    },
    {
      name: "Tariq Hassan",
      email: "TariqHassan@gmail.com",
      userId: "12362",
      role: "Location Manager",
      region: "Middle East, Egypt",
      location: "Zamalek, Cairo",
      status: "Pending",
    },
    {
      name: "Valentina Cruz",
      email: "ValentinaCruz@gmail.com",
      userId: "12363",
      role: "Sales Manager",
      region: "South America, Colombia",
      location: "El Poblado, Medellín",
      status: "Active",
    },
    {
      name: "Oluwaseun Adeyemi",
      email: "OluwaseunAdeyemi@gmail.com",
      userId: "12364",
      role: "Regional Director",
      region: "Africa, Nigeria",
      location: "Lekki, Lagos",
      status: "Active",
    },
    {
      name: "Nadia Petrov",
      email: "NadiaPetrov@gmail.com",
      userId: "12365",
      role: "Location Manager",
      region: "Europe, Ukraine",
      location: "Pechersk, Kyiv",
      status: "Inactive",
    },
    {
      name: "Jae-won Park",
      email: "JaewonPark@gmail.com",
      userId: "12366",
      role: "Sales Manager",
      region: "Asia, South Korea",
      location: "Gangnam, Seoul",
      status: "Active",
    },
    {
      name: "Amina Touré",
      email: "AminaToure@gmail.com",
      userId: "12367",
      role: "Location Manager",
      region: "Africa, Ivory Coast",
      location: "Plateau, Abidjan",
      status: "Active",
    },
    {
      name: "Rafael Oliveira",
      email: "RafaelOliveira@gmail.com",
      userId: "12368",
      role: "Regional Director",
      region: "South America, Argentina",
      location: "Palermo, Buenos Aires",
      status: "Pending",
    },
    {
      name: "Zara Osei",
      email: "ZaraOsei@gmail.com",
      userId: "12369",
      role: "Sales Manager",
      region: "Africa, Ghana",
      location: "Osu, Accra",
      status: "Active",
    },
    {
      name: "Henrik Lindqvist",
      email: "HenrikLindqvist@gmail.com",
      userId: "12370",
      role: "Location Manager",
      region: "Europe, Sweden",
      location: "Södermalm, Stockholm",
      status: "Active",
    },
    {
      name: "Blessing Eze",
      email: "BlessingEze@gmail.com",
      userId: "12371",
      role: "Regional Director",
      region: "Africa, Nigeria",
      location: "GRA, Port Harcourt",
      status: "Active",
    },
    {
      name: "Layla Al-Farsi",
      email: "LaylaAlFarsi@gmail.com",
      userId: "12372",
      role: "Sales Manager",
      region: "Middle East, Oman",
      location: "Qurum, Muscat",
      status: "Inactive",
    },
    {
      name: "Tomás Novák",
      email: "TomasNovak@gmail.com",
      userId: "12373",
      role: "Location Manager",
      region: "Europe, Czech Republic",
      location: "Vinohrady, Prague",
      status: "Active",
    },
  ];

  const table = $("#promotersTable").DataTable({
    data: promoters,
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
        data: null,
        orderable: false,
        className: "dt-center",
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

  function updateUI() {
    const info = table.page.info();
    $("#pageIndicator").text(`${info.page + 1} of ${info.pages}`);
    $("#prevPage, #previousPageBtn").toggle(info.page !== 0);
    $("#nextPageTrigger, #nextPageBtn").toggle(info.page !== info.pages - 1);
  }

  $("#nextPageBtn, #nextPageTrigger").on("click", () => {
    table.page("next").draw("page");
    updateUI();
  });
  $("#prevPage, #previousPageBtn").on("click", () => {
    table.page("previous").draw("page");
    updateUI();
  });

  updateUI();

  // 3. EDIT LOGIC
  $("#promotersTable").on("click", ".icon-edit", function () {
    const rowData = table.row($(this).parents("tr")).data();

    $("#editName").val(rowData.name);
    $("#editEmail").val(rowData.email);
    $("#editId").val(rowData.userId);
    $("#editRole").val(rowData.role);

    // REGION FIX
    if ($('#editRegion option[value="' + rowData.region + '"]').length === 0) {
      $("#editRegion").append(
        `<option value="${rowData.region}">${rowData.region}</option>`,
      );
    }
    $("#editRegion").val(rowData.region);

    // LOCATION FIX
    if (
      $('#editLocation option[value="' + rowData.location + '"]').length === 0
    ) {
      $("#editLocation").append(
        `<option value="${rowData.location}">${rowData.location}</option>`,
      );
    }
    $("#editLocation").val(rowData.location);

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
