import React from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import { useImportBrandsCategory } from "../hooks/use-promoters-brands";

const IMPORT_ACCEPT = ".csv,.xlsx,.xls";
const IMPORT_EXTENSIONS = ["csv", "xlsx", "xls"];
const PROMOTER_ID_HEADER_ALIASES = new Set([
  "promoter_id",
  "promoter code",
  "promoter_code",
  "promotion code",
  "promotion_code",
]);
const QR_CODE_HEADER_ALIASES = new Set(["qr code", "qr_code", "promo_url", "promo url"]);

function getFileExtension(fileName) {
  return String(fileName || "").split(".").pop()?.toLowerCase() || "";
}

function validateImportFile(file) {
  if (!file) {
    return "Choose a CSV or Excel file.";
  }

  if (!IMPORT_EXTENSIONS.includes(getFileExtension(file.name))) {
    return "Only CSV, XLSX, or XLS files are supported.";
  }

  return "";
}

function normalizeRowPromoterCode(result) {
  return result.promoter_id || result.promoter_code || "--";
}

function getResultMessage(result) {
  return result.reason || result.message || result.error || "--";
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function getNormalizedHeaderKey(header) {
  return header.trim().toLowerCase();
}

function buildCsvCompatibilityRewrite(contents) {
  const lineBreak = contents.includes("\r\n") ? "\r\n" : "\n";
  const rows = contents.split(/\r?\n/);
  const [headerLine, ...bodyLines] = rows;

  if (!headerLine) {
    return contents;
  }

  const originalHeaders = headerLine.split(",");
  const headerKeys = originalHeaders.map(getNormalizedHeaderKey);
  const promoterIndex = headerKeys.findIndex((header) =>
    PROMOTER_ID_HEADER_ALIASES.has(header),
  );
  const qrIndex = headerKeys.findIndex((header) => QR_CODE_HEADER_ALIASES.has(header));
  const nextHeaders = [...originalHeaders];
  const extraColumns = [];

  if (promoterIndex >= 0 && !headerKeys.includes("promoter_id")) {
    nextHeaders.push("promoter_id");
    extraColumns.push({ sourceIndex: promoterIndex });
  }

  if (promoterIndex >= 0 && !headerKeys.includes("promoter_code")) {
    nextHeaders.push("promoter_code");
    extraColumns.push({ sourceIndex: promoterIndex });
  }

  if (qrIndex >= 0 && !headerKeys.includes("promo_url")) {
    nextHeaders.push("promo_URL");
    extraColumns.push({ sourceIndex: qrIndex });
  }

  if (!extraColumns.length) {
    return contents;
  }

  const rewrittenBodyLines = bodyLines.map((line) => {
    if (!line.trim()) {
      return line;
    }

    const values = line.split(",");
    const extraValues = extraColumns.map(({ sourceIndex }) => values[sourceIndex] ?? "");

    return [...values, ...extraValues].join(",");
  });

  return [nextHeaders.join(","), ...rewrittenBodyLines].join(lineBreak);
}

async function buildUploadFile(file) {
  if (getFileExtension(file.name) !== "csv") {
    return file;
  }

  const contents = await readFileAsText(file);
  const rewrittenContents = buildCsvCompatibilityRewrite(contents);

  if (rewrittenContents === contents) {
    return file;
  }

  return new File(
    [rewrittenContents],
    file.name,
    {
      type: file.type || "text/csv",
      lastModified: file.lastModified,
    },
  );
}

export default function ImportBrandsPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [importResponse, setImportResponse] = useState(null);
  const { mutateAsync: importBrandsCategory, isPending } = useImportBrandsCategory();

  const resultCounts = useMemo(() => {
    const summary = importResponse?.summary;

    return [
      { label: "Total Rows", value: summary?.total ?? 0 },
      { label: "Imported", value: summary?.imported ?? 0 },
      { label: "Updated", value: summary?.updated ?? 0 },
      { label: "Failed", value: summary?.failed ?? 0 },
    ];
  }, [importResponse]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    const validationError = validateImportFile(file);

    setSelectedFile(validationError ? null : file);
    setFileError(validationError);

    if (validationError) {
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateImportFile(selectedFile);

    if (validationError) {
      setFileError(validationError);
      return;
    }

    try {
      const uploadFile = await buildUploadFile(selectedFile);
      const response = await importBrandsCategory({ file: uploadFile });

      setImportResponse(response);

      await Swal.fire({
        icon: response.summary.failed > 0 ? "warning" : "success",
        title: "Import Complete",
        text: response.message,
        confirmButtonColor: response.summary.failed > 0 ? "#f59e0b" : "#22c55e",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Import Brands",
        text: error?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <AppLayout activeNav="add-promoter" mainContentClassName="add-promoter-main">
      <div className="main-card brand-import-card">
        <div className="card-header brand-import-header">
          <div>
            <p className="brands-admin-eyebrow">Add Promoters</p>
            <h2>Excel Upload</h2>
            <p>
              Upload promoter-to-brand QR assignments with promoter_id, brand,
              and qr code columns. The qr code column should contain an existing
              image path or URL. CSV uploads can also use promoter code.
            </p>
          </div>
        </div>

        <div className="add-promoter-view-switch add-promoter-view-switch--left" aria-label="Add promoter method">
          <Link to="/promoters/new">
            Manual Entry
          </Link>
          <Link to="/promoters/import-brands" className="is-active" aria-current="page">
            Excel Upload
          </Link>
        </div>

        <section className="brand-import-panel">
          <form className="brand-import-form" onSubmit={handleSubmit}>
            <label htmlFor="brandsImportFile">Import File</label>
            <div className="brand-import-file-row">
              <input
                id="brandsImportFile"
                type="file"
                accept={IMPORT_ACCEPT}
                disabled={isPending}
                onChange={handleFileChange}
              />
              <button
                type="submit"
                className="brand-admin-primary-btn"
                disabled={isPending || !selectedFile}
              >
                {isPending ? "Importing..." : "Import File"}
              </button>
            </div>
            <div className="brand-import-file-meta">
              <span>{selectedFile?.name || "CSV, XLSX, or XLS"}</span>
              <span>Required columns: promoter_id, brand, qr code</span>
            </div>
            <p className="brand-import-note">
              This upload does not attach QR image files from your computer. It
              imports references to QR images that have already been uploaded,
              such as uploads/attachments/example.png.
            </p>
            {fileError ? (
              <p className="form-error-text" role="alert">
                {fileError}
              </p>
            ) : null}
          </form>
        </section>

        {importResponse ? (
          <>
            <section className="brand-import-summary" aria-label="Import summary">
              {resultCounts.map((item) => (
                <div className="brand-import-summary-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </section>

            <div className="table-outer-border">
              <table className="data-table brand-import-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Promoter Code</th>
                    <th>Brand</th>
                    <th>Status</th>
                    <th>QR / Promo URL</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {importResponse.results.length ? (
                    importResponse.results.map((result) => (
                      <tr key={`${result.row}-${normalizeRowPromoterCode(result)}-${result.brand}`}>
                        <td>{result.row}</td>
                        <td>{normalizeRowPromoterCode(result)}</td>
                        <td>{result.brand || "--"}</td>
                        <td>
                          <span
                            className={`brand-import-status is-${String(result.status)
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")}`}
                          >
                            {result.status}
                          </span>
                        </td>
                        <td>
                          {result.promo_URL ? (
                            <a
                              className="brand-import-url"
                              href={result.promo_URL}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open QR
                            </a>
                          ) : (
                            "--"
                          )}
                        </td>
                        <td>{getResultMessage(result)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="brands-admin-empty">
                        No row details returned.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <section className="brand-import-empty">
            <strong>No import run yet.</strong>
            <span>Results will appear here after the file is processed.</span>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
