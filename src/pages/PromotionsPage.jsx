import React from "react";
import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import {
  Button,
  DateInput,
  SelectInput,
  TextArea,
  TextInput,
} from "../components/FormControls";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import {
  useCreatePromotion,
  usePromotionBrands,
  usePromotions,
  useUpdatePromotion,
  useUploadPromotionQrCodesBulk,
} from "../hooks/use-promotions";
import { useImportBrandsCategory } from "../hooks/use-promoters-brands";
import { useTablePagination } from "../hooks/use-table-pagination";

const EMPTY_PROMOTION_FORM = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "",
};
const PROMOTION_UPLOAD_FILE_BASENAME = "Promotion Management";
const PROMOTION_UPLOAD_ACCEPT = ".csv,.xlsx,.xls";
const PROMOTION_QR_ZIP_ACCEPT = ".zip";
const PROMOTION_STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Expired", value: "expired" },
];

function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getPromotionState(promotion) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = promotion.startDate ? new Date(`${promotion.startDate}T00:00:00`) : null;
  const endDate = promotion.endDate ? new Date(`${promotion.endDate}T00:00:00`) : null;

  if (!promotion.isActive) {
    if (promotion.status === "draft") {
      return { label: "Draft", className: "is-draft" };
    }

    if (promotion.status === "expired") {
      return { label: "Expired", className: "is-expired" };
    }

    return { label: "Inactive", className: "is-inactive" };
  }

  if (startDate && today < startDate) {
    return { label: "Scheduled", className: "is-scheduled" };
  }

  if (endDate && today > endDate) {
    return { label: "Expired", className: "is-expired" };
  }

  return { label: "Active", className: "is-active" };
}

function canManagePromotion(promotion) {
  const state = getPromotionState(promotion);

  return state.label === "Active" || state.label === "Scheduled";
}

function isCurrentlyActivePromotion(promotion) {
  return getPromotionState(promotion).label === "Active";
}

function getPromotionCode(promotion) {
  return promotion?.promotionCode || String(promotion?.id || "");
}

function getFileExtension(fileName) {
  return String(fileName || "").split(".").pop()?.toLowerCase() || "";
}

function getFileBaseName(fileName) {
  const normalizedFileName = String(fileName || "");
  const extension = getFileExtension(normalizedFileName);

  return extension
    ? normalizedFileName.slice(0, -(extension.length + 1))
    : normalizedFileName;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createCrc32Table() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    return value >>> 0;
  });
}

const CRC32_TABLE = createCrc32Table();

function getCrc32(bytes) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createZipBlob(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const centralDirectoryChunks = [];
  let offset = 0;

  const writeUint16 = (value) => [value & 0xff, (value >>> 8) & 0xff];
  const writeUint32 = (value) => [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ];
  const today = new Date();
  const zipTime =
    (today.getHours() << 11) | (today.getMinutes() << 5) | (today.getSeconds() / 2);
  const zipDate =
    ((today.getFullYear() - 1980) << 9) |
    ((today.getMonth() + 1) << 5) |
    today.getDate();

  files.forEach(({ name, content }) => {
    const nameBytes = encoder.encode(name);
    const contentBytes = encoder.encode(content);
    const crc = getCrc32(contentBytes);
    const localHeader = new Uint8Array([
      ...writeUint32(0x04034b50),
      ...writeUint16(20),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(zipTime),
      ...writeUint16(zipDate),
      ...writeUint32(crc),
      ...writeUint32(contentBytes.length),
      ...writeUint32(contentBytes.length),
      ...writeUint16(nameBytes.length),
      ...writeUint16(0),
    ]);
    const centralDirectoryHeader = new Uint8Array([
      ...writeUint32(0x02014b50),
      ...writeUint16(20),
      ...writeUint16(20),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(zipTime),
      ...writeUint16(zipDate),
      ...writeUint32(crc),
      ...writeUint32(contentBytes.length),
      ...writeUint32(contentBytes.length),
      ...writeUint16(nameBytes.length),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint32(0),
      ...writeUint32(offset),
    ]);

    chunks.push(localHeader, nameBytes, contentBytes);
    centralDirectoryChunks.push(centralDirectoryHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + contentBytes.length;
  });

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralDirectoryChunks.reduce(
    (size, chunk) => size + chunk.length,
    0,
  );
  const endOfCentralDirectory = new Uint8Array([
    ...writeUint32(0x06054b50),
    ...writeUint16(0),
    ...writeUint16(0),
    ...writeUint16(files.length),
    ...writeUint16(files.length),
    ...writeUint32(centralDirectorySize),
    ...writeUint32(centralDirectoryOffset),
    ...writeUint16(0),
  ]);

  return new Blob([...chunks, ...centralDirectoryChunks, endOfCentralDirectory], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function createPromotionWorkbookTemplateBlob(promotionCode) {
  const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:D2"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="22" customWidth="1"/><col min="3" max="3" width="24" customWidth="1"/><col min="4" max="4" width="28" customWidth="1"/></cols>
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr" s="1"><is><t>promotion_code</t></is></c>
      <c r="B1" t="inlineStr" s="1"><is><t>promoter_code</t></is></c>
      <c r="C1" t="inlineStr" s="1"><is><t>brand</t></is></c>
      <c r="D1" t="inlineStr" s="1"><is><t>qr code</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>${escapeXml(promotionCode)}</t></is></c>
      <c r="B2" t="inlineStr"><is><t></t></is></c>
      <c r="C2" t="inlineStr"><is><t></t></is></c>
      <c r="D2" t="inlineStr"><is><t></t></is></c>
    </row>
  </sheetData>
</worksheet>`;

  return createZipBlob([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Promolocation</Application>
</Properties>`,
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Promotion Management Template</dc:title>
  <dc:creator>Promolocation</dc:creator>
  <cp:lastModifiedBy>Promolocation</cp:lastModifiedBy>
</cp:coreProperties>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Promotion Management" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
</styleSheet>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: worksheetXml,
    },
  ]);
}

function downloadPromotionWorkbookTemplate(promotionCode) {
  const blob = createPromotionWorkbookTemplateBlob(promotionCode);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${PROMOTION_UPLOAD_FILE_BASENAME}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function validatePromotionUploadFileName(file) {
  if (!file) {
    return "Choose the Promotion Management file.";
  }

  const allowedFileNamePattern = new RegExp(
    `^${PROMOTION_UPLOAD_FILE_BASENAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( \\([1-9][0-9]*\\))?$`,
  );

  if (!allowedFileNamePattern.test(getFileBaseName(file.name))) {
    return `The file name must be ${PROMOTION_UPLOAD_FILE_BASENAME}, or a numbered browser copy like ${PROMOTION_UPLOAD_FILE_BASENAME} (1).`;
  }

  return "";
}

function validatePromotionQrZipFile(file) {
  if (!file) {
    return "Choose the QR images zip file.";
  }

  if (getFileExtension(file.name) !== "zip") {
    return "Upload the QR images as a .zip file.";
  }

  return "";
}

function formatUploadDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

function getQrUploadStatus(response, uploadedAt) {
  if (!response) {
    return "Not uploaded yet";
  }

  const uploadedCount = response.summary?.uploaded ?? 0;
  const failedCount = response.summary?.failed ?? 0;
  const warningCount = response.summary?.warnings ?? 0;
  const parts = [`${uploadedCount} code${uploadedCount === 1 ? "" : "s"} uploaded`];

  if (failedCount > 0) {
    parts.push(`${failedCount} failed`);
  }

  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount === 1 ? "" : "s"}`);
  }

  if (uploadedAt) {
    parts.push(formatUploadDate(uploadedAt));
  }

  return parts.join(" · ");
}

function getWorkbookUploadStatus(response, uploadedAt) {
  if (!response) {
    return "Not uploaded yet";
  }

  const summary = response.summary || {};
  const processedCount = summary.total ?? 0;
  const importedCount = summary.imported ?? 0;
  const updatedCount = summary.updated ?? 0;
  const failedCount = summary.failed ?? 0;
  const parts = [
    `${processedCount} row${processedCount === 1 ? "" : "s"} processed`,
    `${importedCount} imported`,
    `${updatedCount} updated`,
  ];

  if (failedCount > 0) {
    parts.push(`${failedCount} failed`);
  }

  if (uploadedAt) {
    parts.push(formatUploadDate(uploadedAt));
  }

  return parts.join(" · ");
}

function hasSamePromotionId(firstId, secondId) {
  return String(firstId) === String(secondId);
}

function getPromotionSortTime(promotion) {
  const timestamp = promotion.updatedAt || promotion.createdAt || "";
  const parsedTime = new Date(timestamp.replace(" ", "T")).getTime();

  return Number.isNaN(parsedTime) ? 0 : parsedTime;
}

function sortPromotions(promotions) {
  return [...promotions].sort((firstPromotion, secondPromotion) => {
    if (firstPromotion.isActive !== secondPromotion.isActive) {
      return firstPromotion.isActive ? -1 : 1;
    }

    return getPromotionSortTime(secondPromotion) - getPromotionSortTime(firstPromotion);
  });
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="grey" strokeWidth="2">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function PromotionFormModal({
  currentStatus = "",
  form,
  formError,
  isOpen,
  mode,
  onClose,
  isSubmitting = false,
  onSubmit,
  setForm,
  submitLabel,
}) {
  const statusOptions = PROMOTION_STATUS_OPTIONS.filter(
    (option) => option.value !== currentStatus,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="modal-content promotion-modal"
    >
      <div className="modal-header promoter-edit-header">
        <div>
          <p className="modal-eyebrow">Promotion</p>
          <h2>{mode === "create" ? "Create Promotion" : "Edit Promotion"}</h2>
        </div>
        <button
          type="button"
          className="close-modal"
          aria-label="Close promotion modal"
          onClick={onClose}
        >
          &times;
        </button>
      </div>

      <form className="promotion-form" onSubmit={onSubmit}>
        <TextInput
          id="promotionName"
          label="Promotion Name"
          type="text"
          value={form.name}
          onChange={(event) =>
            setForm((currentForm) => ({
              ...currentForm,
              name: event.target.value,
            }))
          }
          placeholder="Summer Activation"
        />

        <TextArea
          id="promotionDescription"
          label="Description"
          value={form.description}
          onChange={(event) =>
            setForm((currentForm) => ({
              ...currentForm,
              description: event.target.value,
            }))
          }
          placeholder="What this promotion covers"
          rows={4}
        />

        <div className="promotion-date-grid">
          <DateInput
            id="promotionStartDate"
            label="Start Date"
            value={form.startDate}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                startDate: event.target.value,
              }))
            }
          />

          <DateInput
            id="promotionEndDate"
            label="End Date"
            value={form.endDate}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                endDate: event.target.value,
              }))
            }
          />
        </div>

        {mode === "edit" ? (
          <SelectInput
            id="promotionStatus"
            label="Change Status"
            value={form.status}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                status: event.target.value,
              }))
            }
          >
            <option value="">Keep current status</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        ) : null}

        {formError ? (
          <p className="form-error-text" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="brand-admin-form-actions">
          <Button
            type="button"
            variant="secondary"
            className="brand-admin-secondary-btn"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="brand-admin-primary-btn"
            disabled={isSubmitting}
          >
            {submitLabel || (mode === "create" ? "Create Promotion" : "Save Changes")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PromotionsListView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [form, setForm] = useState(EMPTY_PROMOTION_FORM);
  const [formError, setFormError] = useState("");
  const {
    data: promotions = [],
    isLoading,
    isError,
    error,
  } = usePromotions();
  const { mutateAsync: createPromotion, isPending: isCreatingPromotion } =
    useCreatePromotion();
  const { mutateAsync: updatePromotion, isPending: isUpdatingPromotion } =
    useUpdatePromotion();
  const isSavingPromotion = isCreatingPromotion || isUpdatingPromotion;

  const sortedPromotions = useMemo(() => sortPromotions(promotions), [promotions]);
  const activePromotion = useMemo(
    () => promotions.find(isCurrentlyActivePromotion),
    [promotions],
  );

  const filteredPromotions = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return sortedPromotions;
    }

    return sortedPromotions.filter((promotion) =>
      [promotion.name, getPromotionState(promotion).label]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm),
    );
  }, [searchTerm, sortedPromotions]);
  const {
    currentPage,
    paginatedItems: paginatedPromotions,
    setCurrentPage,
    totalPages,
  } = useTablePagination(filteredPromotions, [searchTerm, promotions.length]);

  const openCreateModal = () => {
    setEditingPromotion({ mode: "create" });
    setForm(EMPTY_PROMOTION_FORM);
    setFormError("");
  };

  const openEditModal = (promotion) => {
    setEditingPromotion(promotion);
    setForm({
      name: promotion.name,
      description: promotion.description || "",
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      status: "",
    });
    setFormError("");
  };

  const closeModal = () => {
    setEditingPromotion(null);
    setForm(EMPTY_PROMOTION_FORM);
    setFormError("");
  };

  const savePromotion = async (event) => {
    event.preventDefault();

    if (isSavingPromotion) {
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setFormError("Promotion name is required.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setFormError("Start date and end date are required.");
      return;
    }

    if (form.startDate > form.endDate) {
      setFormError("End date must be after the start date.");
      return;
    }

    const isCreating = editingPromotion?.mode === "create";
    const nextStatus = isCreating ? "draft" : form.status || editingPromotion.status;
    const isActive = nextStatus === "active";
    const isActivatingDifferentPromotion =
      isActive &&
      activePromotion &&
      (isCreating || !hasSamePromotionId(activePromotion.id, editingPromotion.id));

    if (isActivatingDifferentPromotion) {
      setFormError(
        `${activePromotion.name} is currently active. Make it inactive before activating another promotion.`,
      );
      return;
    }

    try {
      if (isCreating) {
        await createPromotion({
          name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          status: "draft",
          isActive: false,
        });
      } else {
        const updatePayload = {
          id: editingPromotion.id,
          name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
        };

        if (form.status) {
          updatePayload.status = form.status;
          updatePayload.isActive = isActive;
        }

        await updatePromotion(updatePayload);
      }

      await Swal.fire({
        icon: "success",
        title: isCreating ? "Promotion Created" : "Promotion Updated",
        text: `${name} has been saved.`,
        confirmButtonColor: "#22c55e",
      });

      closeModal();
    } catch (submitError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Save Promotion",
        text: submitError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <AppLayout activeNav="promotions">
      <div className="main-card promotions-card">
        <div className="card-header promotions-header">
          <div>
            <p className="brands-admin-eyebrow">Promotion Control</p>
            <h2>Promotions</h2>
            <p>
              Define promotion windows first, then manage the promoter-brand QR
              rows inside each promotion.
            </p>
          </div>
          {!activePromotion ? (
            <button
              type="button"
              className="brand-admin-primary-btn"
              disabled={isSavingPromotion}
              onClick={openCreateModal}
            >
              Create Promotion
            </button>
          ) : null}
        </div>

        <div className="brands-admin-toolbar">
          <div className="search-bar">
            <SearchIcon />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search promotions"
            />
          </div>
          <span className="brands-admin-count">
            {filteredPromotions.length} of {promotions.length} promotions
          </span>
        </div>

        {isError ? (
          <div className="brands-admin-state" role="alert">
            {error?.message || "Unable to load promotions right now."}
          </div>
        ) : (
        <div className="table-outer-border">
          <table className="data-table promotions-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Promotion</th>
                <th>Duration</th>
                <th>Status</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="brands-admin-empty">
                    Loading promotions...
                  </td>
                </tr>
              ) : paginatedPromotions.length ? (
                paginatedPromotions.map((promotion) => {
                  const promotionState = getPromotionState(promotion);

                  return (
                    <tr key={promotion.id}>
                      <td>
                        <span className="promotion-code-pill">
                          {getPromotionCode(promotion)}
                        </span>
                      </td>
                      <td>
                        <div className="promotion-name-cell">
                          <strong>{promotion.name}</strong>
                          <span>Updated {formatDate(promotion.updatedAt?.slice(0, 10))}</span>
                        </div>
                      </td>
                      <td>
                        {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                      </td>
                      <td>
                        <span className={`promotion-status ${promotionState.className}`}>
                          {promotionState.label}
                        </span>
                      </td>
                      <td className="actions-column">
                        <div className="brand-admin-actions">
                          {canManagePromotion(promotion) ? (
                            <Link to={`/promotions/${promotion.id}`}>Manage</Link>
                          ) : (
                            <button
                              type="button"
                              className="is-disabled"
                              disabled
                              title="Only active and scheduled promotions can be managed."
                            >
                              Manage
                            </button>
                          )}
                          <button type="button" onClick={() => openEditModal(promotion)}>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="brands-admin-empty">
                    No promotions created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
        <div className="card-footer">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <PromotionFormModal
        currentStatus={editingPromotion?.status || ""}
        form={form}
        formError={formError}
        isOpen={Boolean(editingPromotion)}
        mode={editingPromotion?.mode === "create" ? "create" : "edit"}
        onClose={closeModal}
        isSubmitting={isSavingPromotion}
        onSubmit={savePromotion}
        setForm={setForm}
        submitLabel={
          isSavingPromotion
            ? editingPromotion?.mode === "create"
              ? "Creating Promotion..."
              : "Saving Changes..."
            : undefined
        }
      />
    </AppLayout>
  );
}

function UploadedPromoterBrandsTable({
  isError,
  isLoading,
  promotion,
  promotionBrands,
  promotionBrandsError,
  promoId,
}) {
  const {
    currentPage,
    paginatedItems: paginatedPromotionBrands,
    setCurrentPage,
    totalPages,
  } = useTablePagination(promotionBrands, [promoId, promotionBrands.length]);

  return (
    <section className="promotion-assignment-panel">
      <div className="promotion-assignment-panel-header">
        <div>
          <h3>Uploaded Promoter Brands</h3>
          <p>
            Rows currently assigned to promotion code {promoId}.
          </p>
        </div>
        <span className="brands-admin-count">
          {promotionBrands.length} rows
        </span>
      </div>

      {isError ? (
        <div className="brands-admin-state" role="alert">
          {promotionBrandsError?.message || "Unable to load uploaded brands."}
        </div>
      ) : (
        <div className="table-outer-border promotion-brands-table-wrap">
          <table className="data-table promotion-brands-table">
            <thead>
              <tr>
                <th>Promoter</th>
                <th>Brand</th>
                <th>QR Code</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="brands-admin-empty">
                    Loading uploaded brands...
                  </td>
                </tr>
              ) : paginatedPromotionBrands.length ? (
                paginatedPromotionBrands.map((brand) => (
                  <tr key={brand.id}>
                    <td>
                      <span className="promotion-code-pill">
                        {brand.promoterId || "--"}
                      </span>
                    </td>
                    <td>
                      <div className="brand-admin-name-cell">
                        <span className="brand-admin-logo">
                          {brand.brandImageUrl ? (
                            <img src={brand.brandImageUrl} alt="" />
                          ) : (
                            brand.brandName.slice(0, 1).toUpperCase() || "B"
                          )}
                        </span>
                        <div>
                          <strong>{brand.brandName || "--"}</strong>
                          <span>{brand.promotionName || promotion.name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {brand.qrPath ? (
                        <a
                          className="promotion-brand-qr-link"
                          href={brand.qrPath}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View QR
                        </a>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td>{formatDate(brand.createdAt?.slice(0, 10))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="brands-admin-empty">
                    No uploaded promoter-brand rows yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="card-footer">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </section>
  );
}

function PromotionManagementView({
  isActivePromotionRoute = false,
  isPromotionsError = false,
  isPromotionsLoading = false,
  promotions,
  promotionsError,
}) {
  const { promotionId } = useParams();
  const promotion = isActivePromotionRoute
    ? promotions.find(isCurrentlyActivePromotion)
    : promotions.find((currentPromotion) =>
        hasSamePromotionId(currentPromotion.id, promotionId),
      );
  const qrZipInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [qrZipFile, setQrZipFile] = useState(null);
  const [qrZipValidation, setQrZipValidation] = useState({
    error: "",
    payload: null,
    status: "idle",
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadValidation, setUploadValidation] = useState({
    error: "",
    payload: null,
    status: "idle",
  });
  const [qrUploadResponse, setQrUploadResponse] = useState(null);
  const [assignmentUploadResponse, setAssignmentUploadResponse] = useState(null);
  const [qrUploadCompletedAt, setQrUploadCompletedAt] = useState(null);
  const [workbookUploadCompletedAt, setWorkbookUploadCompletedAt] = useState(null);
  const [dragTarget, setDragTarget] = useState(null);
  const { mutateAsync: uploadQrCodesBulk, isPending: isUploadingQrCodes } =
    useUploadPromotionQrCodesBulk();
  const {
    mutateAsync: importBrandsCategory,
    isPending: isUploadingAssignments,
  } = useImportBrandsCategory();
  const promoId = getPromotionCode(promotion);
  const {
    data: promotionBrands = [],
    isLoading: isLoadingPromotionBrands,
    isError: isPromotionBrandsError,
    error: promotionBrandsError,
    refetch: refetchPromotionBrands,
  } = usePromotionBrands(promoId, Boolean(promotion));

  if (!promotion && isPromotionsLoading) {
    return (
      <AppLayout activeNav={isActivePromotionRoute ? "active-promotion" : "promotions"}>
        <div className="main-card promotions-card">
          <div className="brands-admin-state">
            Loading promotion...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!promotion && isPromotionsError) {
    return (
      <AppLayout activeNav={isActivePromotionRoute ? "active-promotion" : "promotions"}>
        <div className="main-card promotions-card">
          <div className="brands-admin-state" role="alert">
            {promotionsError?.message || "Unable to load promotions."}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!promotion) {
    return (
      <AppLayout activeNav={isActivePromotionRoute ? "active-promotion" : "promotions"}>
        <div className="main-card promotions-card">
          <div className="brands-admin-state">
            <strong>
              {isActivePromotionRoute ? "No active promotion found." : "Promotion not found."}
            </strong>
            <Link to="/promotions" className="brand-admin-secondary-link">
              Back to Promotions
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const promotionState = getPromotionState(promotion);
  const isQrZipValid = qrZipValidation.status === "valid";
  const isUploadValid = uploadValidation.status === "valid";

  if (!isActivePromotionRoute && !canManagePromotion(promotion)) {
    return (
      <AppLayout activeNav="promotions">
        <div className="main-card promotions-card">
          <div className="brands-admin-state promotion-management-blocked">
            <strong>{promotion.name} cannot be managed.</strong>
            <span>
              Only active and scheduled promotions can upload QR codes or manage
              promoter-brand rows.
            </span>
            <Link to="/promotions" className="brand-admin-secondary-link">
              Back to Promotions
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isActivePromotionRoute) {
    return (
      <AppLayout activeNav="active-promotion">
        <div className="main-card promotions-card active-promotion-card">
          <UploadedPromoterBrandsTable
            isError={isPromotionBrandsError}
            isLoading={isLoadingPromotionBrands}
            promotion={promotion}
            promotionBrands={promotionBrands}
            promotionBrandsError={promotionBrandsError}
            promoId={promoId}
          />
        </div>
      </AppLayout>
    );
  }

  const prepareQrZipFile = (selectedFile) => {
    const validationError = validatePromotionQrZipFile(selectedFile);

    setQrZipFile(selectedFile);
    setQrZipValidation({
      error: validationError,
      payload:
        selectedFile && !validationError
          ? {
              file: selectedFile,
            }
          : null,
      status: selectedFile && !validationError ? "valid" : "invalid",
    });
  };

  const handleQrZipFileChange = (event) => {
    prepareQrZipFile(event.target.files?.[0] || null);
  };

  const clearQrZipFile = () => {
    setQrZipFile(null);
    setQrZipValidation({
      error: "",
      payload: null,
      status: "idle",
    });
    setQrUploadResponse(null);
    setQrUploadCompletedAt(null);

    if (qrZipInputRef.current) {
      qrZipInputRef.current.value = "";
    }
  };

  const prepareUploadFile = (selectedFile) => {
    const validationError = validatePromotionUploadFileName(selectedFile);

    setUploadFile(selectedFile);
    setUploadValidation({
      error: validationError,
      payload:
        selectedFile && !validationError
          ? {
              file: selectedFile,
            }
          : null,
      status: selectedFile && !validationError ? "valid" : "invalid",
    });
  };

  const handleUploadFileChange = (event) => {
    prepareUploadFile(event.target.files?.[0] || null);
  };

  const clearUploadFile = () => {
    setUploadFile(null);
    setUploadValidation({
      error: "",
      payload: null,
      status: "idle",
    });
    setAssignmentUploadResponse(null);
    setWorkbookUploadCompletedAt(null);

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleDropzoneKeyDown = (event, inputRef) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    inputRef.current?.click();
  };

  const handleDropzoneDragOver = (event, target) => {
    event.preventDefault();
    setDragTarget(target);
  };

  const handleDropzoneDragLeave = (event, target) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setDragTarget((currentTarget) => (currentTarget === target ? null : currentTarget));
  };

  const handleQrZipDrop = (event) => {
    event.preventDefault();
    setDragTarget(null);
    const selectedFile = event.dataTransfer.files?.[0] || null;
    prepareQrZipFile(selectedFile);
  };

  const handleWorkbookDrop = (event) => {
    event.preventDefault();
    setDragTarget(null);
    const selectedFile = event.dataTransfer.files?.[0] || null;
    prepareUploadFile(selectedFile);
  };

  const handlePreparedUpload = async (event) => {
    event.preventDefault();

    if (isUploadingQrCodes) {
      return;
    }

    if (!isQrZipValid) {
      setQrZipValidation((currentValidation) => ({
        ...currentValidation,
        error: currentValidation.error || "Choose the QR images zip file first.",
        status: "invalid",
      }));
      return;
    }

    try {
      const response = await uploadQrCodesBulk({
        file: qrZipValidation.payload.file,
      });

      setQrUploadResponse(response);
      setQrUploadCompletedAt(new Date());

      await Swal.fire({
        icon: "success",
        title: "QR Codes Uploaded",
        text: response.message || `QR zip uploaded for promotion ${promoId}.`,
        confirmButtonColor: "#22c55e",
      });
    } catch (uploadError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Upload QR Codes",
        text: uploadError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleAssignmentUpload = async () => {
    if (isUploadingAssignments) {
      return;
    }

    if (!isUploadValid) {
      setUploadValidation((currentValidation) => ({
        ...currentValidation,
        error: currentValidation.error || "Choose a file named Promotion Management first.",
        status: "invalid",
      }));
      return;
    }

    try {
      const response = await importBrandsCategory({
        file: uploadValidation.payload.file,
      });

      setAssignmentUploadResponse(response);
      setWorkbookUploadCompletedAt(new Date());
      void refetchPromotionBrands();

      await Swal.fire({
        icon: response.summary?.failed > 0 ? "warning" : "success",
        title: "Workbook Import Complete",
        text: response.message || `Workbook uploaded for promotion ${promoId}.`,
        confirmButtonColor: response.summary?.failed > 0 ? "#f59e0b" : "#22c55e",
      });
    } catch (uploadError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Upload Workbook",
        text: uploadError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <AppLayout activeNav={isActivePromotionRoute ? "active-promotion" : "promotions"}>
      <div className="main-card promotions-card promotion-management-card">
        <div className="promotion-management-header">
          <div>
            <Link to="/promotions" className="promotion-back-link">
              Back to Promotions
            </Link>
            <p className="brands-admin-eyebrow">Promotion Management</p>
            <h2>{promotion.name}</h2>
            <div className="promotion-management-meta">
              <span className="promotion-management-code">
                <span>Promotion Code</span>
                <strong>{promoId}</strong>
              </span>
              <span className="promotion-management-duration">
                {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
              </span>
            </div>
          </div>
          <span className={`promotion-status ${promotionState.className}`}>
            {promotionState.label}
          </span>
        </div>

        <section className="promotion-assignment-panel">
          <div className="promotion-assignment-panel-header">
            <div>
              <h3>Promotion Assignments</h3>
              <p>
                Manage the upload files that power promoter-brand QR assignments
                for this active promotion.
              </p>
            </div>
          </div>

          <div className="promotion-upload-note">
            <strong>Independent uploads</strong>
            <span>
              QR image zips and promoter workbooks are separate actions. Upload
              one file at a time, in any order, whenever that file is ready.
            </span>
          </div>

          <details className="promotion-upload-how">
            <summary>How this works</summary>
            <div>
              <p>
                The workbook references QR codes that already exist on the
                backend. If a workbook row uses QR code 12345, the matching QR
                image should be named 12345.png, 12345.jpg, or the matching
                image extension inside any uploaded QR zip.
              </p>
              <p>
                Workbook columns must match the backend contract exactly:
                <code>promotion_code</code>, <code>promoter_code</code>,{" "}
                <code>brand</code>, and <code>qr code</code>.
              </p>
            </div>
          </details>

          <div className="promotion-upload-card-grid">
            <form className="promotion-upload-card" onSubmit={handlePreparedUpload}>
              <div className="promotion-upload-card-header">
                <div>
                  <span className="promotion-upload-kicker">QR Images</span>
                  <h4>Upload QR code images</h4>
                </div>
                <span
                  className={`promotion-upload-status ${
                    qrUploadResponse ? "is-complete" : ""
                  }`.trim()}
                >
                  {getQrUploadStatus(qrUploadResponse, qrUploadCompletedAt)}
                </span>
              </div>

              <p>
                Upload a single zip containing QR images. Each file name should
                match the QR code it represents.
              </p>

              <label
                className={`promotion-upload-dropzone ${
                  dragTarget === "qr" ? "is-dragging" : ""
                }`.trim()}
                htmlFor="promotionQrZipUpload"
                tabIndex={0}
                role="button"
                onKeyDown={(event) => handleDropzoneKeyDown(event, qrZipInputRef)}
                onDragOver={(event) => handleDropzoneDragOver(event, "qr")}
                onDragLeave={(event) => handleDropzoneDragLeave(event, "qr")}
                onDrop={handleQrZipDrop}
              >
                <input
                  id="promotionQrZipUpload"
                  ref={qrZipInputRef}
                  type="file"
                  accept={PROMOTION_QR_ZIP_ACCEPT}
                  onChange={handleQrZipFileChange}
                />
                <span>{qrZipFile ? qrZipFile.name : "Drop QR zip here"}</span>
                <small>or click to browse · .zip only</small>
              </label>

              <div className="promotion-upload-rules">
                <div>
                  <span>Required format</span>
                  <code>qr_codes.zip</code>
                </div>
                <div>
                  <span>Naming example</span>
                  <code>12345.png</code>
                </div>
              </div>

              {qrZipValidation.error ? (
                <p className="promotion-upload-message promotion-upload-message--error" role="alert">
                  {qrZipValidation.error}
                </p>
              ) : null}

              {isQrZipValid ? (
                <div className="promotion-upload-ready">
                  <strong>Ready to upload</strong>
                  <span>{qrZipValidation.payload.file.name}</span>
                </div>
              ) : null}

              {qrUploadResponse ? (
                <p className="promotion-upload-message promotion-upload-message--success">
                  {qrUploadResponse.message || "QR codes uploaded successfully."}
                </p>
              ) : null}

              <div className="promotion-upload-actions">
                {qrZipFile ? (
                  <button
                    type="button"
                    className="brand-admin-secondary-btn"
                    onClick={clearQrZipFile}
                  >
                    Clear QR Zip
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="brand-admin-primary-btn"
                  disabled={!isQrZipValid || isUploadingQrCodes}
                >
                  {isUploadingQrCodes ? "Uploading QR Zip..." : "Upload QR Zip"}
                </button>
              </div>
            </form>

            <form
              className="promotion-upload-card"
              onSubmit={(event) => {
                event.preventDefault();
                void handleAssignmentUpload();
              }}
            >
              <div className="promotion-upload-card-header">
                <div>
                  <span className="promotion-upload-kicker">Promoter Workbook</span>
                  <h4>Upload assignment workbook</h4>
                </div>
                <span
                  className={`promotion-upload-status ${
                    assignmentUploadResponse ? "is-complete" : ""
                  }`.trim()}
                >
                  {getWorkbookUploadStatus(
                    assignmentUploadResponse,
                    workbookUploadCompletedAt,
                  )}
                </span>
              </div>

              <p>
                Upload one workbook where each row maps a promoter to a brand
                and a QR code reference.
              </p>

              <label
                className={`promotion-upload-dropzone ${
                  dragTarget === "workbook" ? "is-dragging" : ""
                }`.trim()}
                htmlFor="promotionManagementUpload"
                tabIndex={0}
                role="button"
                onKeyDown={(event) => handleDropzoneKeyDown(event, uploadInputRef)}
                onDragOver={(event) => handleDropzoneDragOver(event, "workbook")}
                onDragLeave={(event) => handleDropzoneDragLeave(event, "workbook")}
                onDrop={handleWorkbookDrop}
              >
                <input
                  id="promotionManagementUpload"
                  ref={uploadInputRef}
                  type="file"
                  accept={PROMOTION_UPLOAD_ACCEPT}
                  onChange={handleUploadFileChange}
                />
                <span>
                  {uploadFile ? uploadFile.name : "Drop Promotion Management file here"}
                </span>
                <small>or click to browse · CSV, XLS, or XLSX</small>
              </label>

              <div className="promotion-upload-rules">
                <div>
                  <span>Accepted file name</span>
                  <code>{PROMOTION_UPLOAD_FILE_BASENAME}.csv / .xls / .xlsx</code>
                </div>
                <div>
                  <span>Template</span>
                  <button
                    type="button"
                    className="promotion-template-download"
                    onClick={() => downloadPromotionWorkbookTemplate(promoId)}
                  >
                    Download template
                  </button>
                </div>
              </div>

              {uploadValidation.error ? (
                <p className="promotion-upload-message promotion-upload-message--error" role="alert">
                  {uploadValidation.error}
                </p>
              ) : null}

              {isUploadValid ? (
                <div className="promotion-upload-ready">
                  <strong>Ready to upload</strong>
                  <span>{uploadValidation.payload.file.name}</span>
                </div>
              ) : null}

              {assignmentUploadResponse ? (
                <div className="promotion-upload-ready">
                  <strong>Workbook import complete</strong>
                  <span>{assignmentUploadResponse.message}</span>
                  <code>
                    {`total=${assignmentUploadResponse.summary?.total ?? 0}, imported=${assignmentUploadResponse.summary?.imported ?? 0}, updated=${assignmentUploadResponse.summary?.updated ?? 0}, failed=${assignmentUploadResponse.summary?.failed ?? 0}`}
                  </code>
                </div>
              ) : null}

              <div className="promotion-upload-actions">
                {uploadFile ? (
                  <button
                    type="button"
                    className="brand-admin-secondary-btn"
                    onClick={clearUploadFile}
                  >
                    Clear Workbook
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="brand-admin-primary-btn"
                  disabled={!isUploadValid || isUploadingAssignments}
                >
                  {isUploadingAssignments ? "Uploading Workbook..." : "Upload Workbook"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <UploadedPromoterBrandsTable
          isError={isPromotionBrandsError}
          isLoading={isLoadingPromotionBrands}
          promotion={promotion}
          promotionBrands={promotionBrands}
          promotionBrandsError={promotionBrandsError}
          promoId={promoId}
        />
      </div>
    </AppLayout>
  );
}

export default function PromotionsPage({ activePromotionOnly = false }) {
  const { promotionId } = useParams();
  const {
    data: promotions = [],
    isLoading: isPromotionsLoading,
    isError: isPromotionsError,
    error: promotionsError,
  } = usePromotions();

  if (activePromotionOnly) {
    return (
      <PromotionManagementView
        promotions={promotions}
        isPromotionsLoading={isPromotionsLoading}
        isPromotionsError={isPromotionsError}
        promotionsError={promotionsError}
        isActivePromotionRoute
      />
    );
  }

  if (promotionId) {
    return (
      <PromotionManagementView
        promotions={promotions}
        isPromotionsLoading={isPromotionsLoading}
        isPromotionsError={isPromotionsError}
        promotionsError={promotionsError}
      />
    );
  }

  return <PromotionsListView />;
}
