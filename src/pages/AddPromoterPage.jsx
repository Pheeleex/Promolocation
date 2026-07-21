import React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  createPromoter as createPromoterRequest,
  getPromoters,
  updatePromoter as updatePromoterRequest,
} from "../api/promoters";
import AppLayout from "../components/AppLayout";
import { useSystemBrands } from "../hooks/use-promoters-brands";
import { validateQrCodeImageUpload } from "../utils/qrCodeValidation";
import { PROMOTER_CODE_LABEL } from "../utils/uiLabels";

const PROMOTER_CODE_PATTERN = /^[A-Z0-9]{5}$/;
const PROMOTER_CODE_MAX_LENGTH = 5;
const PROMOTER_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp";
const PROMOTER_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const PROMOTER_UPLOAD_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

function createBrandAssignment() {
  return {
    id: `brand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    brandName: "",
    promoFile: null,
    validationStatus: "idle",
    validatedSignature: "",
    error: "",
  };
}

function logAddPromoterResult(label, data) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.log(`[AddPromoterPage] ${label}`, data);
}

function normalizePromoterId(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, PROMOTER_CODE_MAX_LENGTH);
}

function getPromoterIdValidationMessage(value) {
  const normalizedPromoterId = normalizePromoterId(value);

  if (!normalizedPromoterId) {
    return `${PROMOTER_CODE_LABEL} is required.`;
  }

  if (!PROMOTER_CODE_PATTERN.test(normalizedPromoterId)) {
    return `${PROMOTER_CODE_LABEL} must be exactly ${PROMOTER_CODE_MAX_LENGTH} letters or numbers.`;
  }

  return "";
}

function getFileSignature(file) {
  if (!file) {
    return "";
  }

  return [file.name, file.size, file.lastModified, file.type].join(":");
}

export default function AddPromoterPage() {
  const [promoterIdInput, setPromoterIdInput] = useState("");
  const [brandAssignments, setBrandAssignments] = useState(() => [
    createBrandAssignment(),
  ]);
  const [promoterIdError, setPromoterIdError] = useState("");
  const [isPromoterActive, setIsPromoterActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const {
    data: systemBrands = [],
    isLoading: isLoadingSystemBrands,
    isError: isSystemBrandsError,
  } = useSystemBrands();

  const helperCopy =
    `Enter one promo code only. It must contain exactly ${PROMOTER_CODE_MAX_LENGTH} letters or numbers.`;
  const isValidatingBrandQr = brandAssignments.some(
    (assignment) => assignment.validationStatus === "validating",
  );
  const canAddBrandAssignment = brandAssignments.every(
    (assignment) =>
      assignment.brandName.trim() &&
      assignment.promoFile &&
      assignment.validationStatus !== "validating",
  );

  const resetForm = () => {
    setPromoterIdInput("");
    setBrandAssignments([createBrandAssignment()]);
    setPromoterIdError("");
    setIsPromoterActive(true);
  };

  const updateBrandAssignment = (assignmentId, updates) => {
    setBrandAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.id === assignmentId ? { ...assignment, ...updates } : assignment,
      ),
    );
  };

  const addBrandAssignment = () => {
    if (!canAddBrandAssignment) {
      return;
    }

    setBrandAssignments((currentAssignments) => [
      ...currentAssignments,
      createBrandAssignment(),
    ]);
  };

  const removeBrandAssignment = (assignmentId) => {
    setBrandAssignments((currentAssignments) => {
      if (currentAssignments.length === 1) {
        return currentAssignments;
      }

      return currentAssignments.filter((assignment) => assignment.id !== assignmentId);
    });
  };

  const validateBrandAssignmentFile = async (file) => {
    const validationResult = await validateQrCodeImageUpload(file, {
      fileLabel: "Brand QR code",
      allowedMimeTypes: PROMOTER_UPLOAD_MIME_TYPES,
      allowedExtensions: PROMOTER_UPLOAD_EXTENSIONS,
    });

    return validationResult.error;
  };

  const handleBrandAssignmentFileChange = (assignmentId, event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      updateBrandAssignment(assignmentId, {
        promoFile: null,
        validationStatus: "idle",
        validatedSignature: "",
        error: "",
      });
      return;
    }

    const validateSelectedBrandFile = async () => {
      updateBrandAssignment(assignmentId, {
        promoFile: selectedFile,
        validationStatus: "validating",
        validatedSignature: "",
        error: "",
      });

      const validationError = await validateBrandAssignmentFile(selectedFile);

      if (validationError) {
        event.target.value = "";
        updateBrandAssignment(assignmentId, {
          promoFile: null,
          validationStatus: "idle",
          validatedSignature: "",
          error: validationError,
        });
        Swal.fire({
          icon: "error",
          title: "Invalid Brand QR Code",
          text: validationError,
          confirmButtonColor: "#d33",
        });
        return;
      }

      updateBrandAssignment(assignmentId, {
        promoFile: selectedFile,
        validationStatus: "verified",
        validatedSignature: getFileSignature(selectedFile),
        error: "",
      });
    };

    void validateSelectedBrandFile();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedPromoterId = normalizePromoterId(promoterIdInput);
    const validationMessage = getPromoterIdValidationMessage(promoterIdInput);
    const trimmedAssignments = brandAssignments.map((assignment) => ({
      ...assignment,
      brandName: assignment.brandName.trim(),
    }));

    setPromoterIdError("");

    if (validationMessage) {
      setPromoterIdError(validationMessage);
      return;
    }

    if (trimmedAssignments.some((assignment) => assignment.validationStatus === "validating")) {
      return;
    }

    const seenBrands = new Set();
    let hasBrandAssignmentError = false;

    const nextAssignments = trimmedAssignments.map((assignment) => {
      const normalizedBrandName = assignment.brandName.toLowerCase();

      if (!assignment.brandName && !assignment.promoFile) {
        hasBrandAssignmentError = true;
        return {
          ...assignment,
          error: "Select a brand and upload its QR code.",
        };
      }

      if (!assignment.brandName) {
        hasBrandAssignmentError = true;
        return {
          ...assignment,
          error: "Brand name is required.",
        };
      }

      if (!assignment.promoFile) {
        hasBrandAssignmentError = true;
        return {
          ...assignment,
          error: "QR code is required for this brand.",
        };
      }

      if (seenBrands.has(normalizedBrandName)) {
        hasBrandAssignmentError = true;
        return {
          ...assignment,
          error: "This brand has already been added.",
        };
      }

      seenBrands.add(normalizedBrandName);

      return {
        ...assignment,
        error: "",
      };
    });

    setBrandAssignments(nextAssignments);

    if (hasBrandAssignmentError) {
      return;
    }

    const revalidatedAssignments = [];

    for (const assignment of nextAssignments) {
      const promoUrlFileSignature = getFileSignature(assignment.promoFile);

      if (assignment.validatedSignature === promoUrlFileSignature) {
        revalidatedAssignments.push(assignment);
        continue;
      }

      updateBrandAssignment(assignment.id, { validationStatus: "validating" });
      const validationError = await validateBrandAssignmentFile(assignment.promoFile);

      if (validationError) {
        updateBrandAssignment(assignment.id, {
          validationStatus: "idle",
          validatedSignature: "",
          error: validationError,
        });
        return;
      }

      const verifiedAssignment = {
        ...assignment,
        validationStatus: "verified",
        validatedSignature: promoUrlFileSignature,
      };

      updateBrandAssignment(assignment.id, verifiedAssignment);
      revalidatedAssignments.push(verifiedAssignment);
    }

    setIsSubmitting(true);

    try {
      const response = await createPromoterRequest({
        promoter_id: normalizedPromoterId,
        promo_code: normalizedPromoterId,
        brands: revalidatedAssignments.map((assignment) => ({
          brand: assignment.brandName,
          promo_URL: assignment.promoFile,
        })),
      });

      logAddPromoterResult("create promoter response", {
        promoterId: normalizedPromoterId,
        promoCode: normalizedPromoterId,
        response,
      });

      if (!isPromoterActive) {
        let createdPromoterId =
          typeof response.user?.id === "string" || typeof response.user?.id === "number"
            ? String(response.user.id)
            : "";
        let createdFirstName = response.user?.first_name || "";
        let createdLastName = response.user?.last_name || "";

        if (!createdPromoterId) {
          const refreshedPromoters = await queryClient.fetchQuery({
            queryKey: ["promoters"],
            queryFn: getPromoters,
          });

          const createdPromoter = refreshedPromoters.find(
            (promoter) =>
              promoter.promoterId.toLowerCase() === normalizedPromoterId.toLowerCase(),
          );

          if (!createdPromoter) {
            throw new Error(
              "The promoter was created, but we couldn't load the new record to update its status.",
            );
          }

          createdPromoterId = createdPromoter.id;
          createdFirstName = createdPromoter.firstName || "";
          createdLastName = createdPromoter.lastName || "";
        }

        const updateResponse = await updatePromoterRequest({
          user_id: createdPromoterId,
          user_role: "user",
          promoter_id: normalizedPromoterId,
          first_name: createdFirstName,
          last_name: createdLastName,
          status: "inactive",
        });

        logAddPromoterResult("inactive status update response", {
          promoterId: normalizedPromoterId,
          response: updateResponse,
        });
      }

      try {
        await queryClient.invalidateQueries({ queryKey: ["promoters"] });
      } catch {
        // Keep the save flow successful even if the background refresh misses once.
      }

      resetForm();

      Swal.fire({
        icon: "success",
        title: "Promoter Added Successfully!",
        text: isPromoterActive
          ? `${normalizedPromoterId} has been added. Check Promoters List to see newly added promoters.`
          : `${normalizedPromoterId} has been added as inactive. Check Promoters List to see newly added promoters.`,
        confirmButtonColor: "#22c55e",
      });
    } catch (error) {
      const errorMessage =
        error?.message || "Unable to add promoter right now. Please try again.";

      logAddPromoterResult("create promoter error", {
        promoterId: normalizedPromoterId,
        promoCode: normalizedPromoterId,
        error,
      });

      setPromoterIdError(errorMessage);

      Swal.fire({
        icon: "error",
        title: "Unable to Add Promoter",
        text: errorMessage,
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout activeNav="add-promoter" mainContentClassName="add-promoter-main">
      <div className="add-promoter-container add-promoter-page">
        <h1 className="page-title centered">Add Promoters</h1>

        <div className="form-card">
          <div className="form-header">
            <span className="close-form">x</span>
          </div>

          <form id="addPromoterForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="promoterId">
                {PROMOTER_CODE_LABEL} <span className="required-mark">*</span>
              </label>
              <p className="form-helper-text">{helperCopy}</p>
              <input
                id="promoterId"
                type="text"
                className={`promoter-id-input${promoterIdError ? " input-error" : ""}`}
                placeholder="A1B2C"
                value={promoterIdInput}
                disabled={isSubmitting}
                maxLength={PROMOTER_CODE_MAX_LENGTH}
                pattern="[A-Za-z0-9]{5}"
                autoCorrect="off"
                spellCheck="false"
                aria-invalid={Boolean(promoterIdError)}
                aria-describedby={promoterIdError ? "promoterId-error" : "promoterId-help"}
                onChange={(event) => {
                  setPromoterIdInput(normalizePromoterId(event.target.value));
                  setPromoterIdError("");
                }}
              />
              {promoterIdError ? (
                <p id="promoterId-error" className="form-error-text" role="alert">
                  {promoterIdError}
                </p>
              ) : (
                <p id="promoterId-help" className="form-meta-text">
                  {`Use exactly ${PROMOTER_CODE_MAX_LENGTH} letters or numbers.`}
                </p>
              )}
            </div>

            <section className="brand-assignments-section">
              <div className="brand-assignments-header">
                <div>
                  <h2>Brands &amp; QR Codes</h2>
                  <p>
                    Add each brand this promoter belongs to and upload the QR code
                    for that brand.
                  </p>
                </div>
                <span>{brandAssignments.length}</span>
              </div>

              {isSystemBrandsError ? (
                <p className="form-error-text" role="alert">
                  Unable to load brand names right now.
                </p>
              ) : null}

              <div className="brand-assignment-list">
                {brandAssignments.map((assignment, index) => (
                  <div
                    className={`brand-assignment-row ${
                      assignment.error ? "brand-assignment-row--error" : ""
                    }`}
                    key={assignment.id}
                  >
                    <div className="brand-assignment-row-header">
                      <h3>Brand {index + 1}</h3>
                      {brandAssignments.length > 1 ? (
                        <button
                          type="button"
                          className="brand-assignment-remove"
                          disabled={isSubmitting}
                          onClick={() => removeBrandAssignment(assignment.id)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="brand-assignment-grid">
                      <div className="form-group">
                        <label htmlFor={`brandName-${assignment.id}`}>
                          Brand Name <span className="required-mark">*</span>
                        </label>
                        <select
                          id={`brandName-${assignment.id}`}
                          value={assignment.brandName}
                          disabled={isSubmitting || isLoadingSystemBrands}
                          onChange={(event) =>
                            updateBrandAssignment(assignment.id, {
                              brandName: event.target.value,
                              error: "",
                            })
                          }
                        >
                          <option value="" disabled>
                            {isLoadingSystemBrands ? "Loading brands..." : "Select brand"}
                          </option>
                          {systemBrands.map((brand) => (
                            <option key={brand.id} value={brand.name}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`promoUrlFile-${assignment.id}`}>
                          QR Code <span className="required-mark">*</span>
                        </label>
                        <input
                          id={`promoUrlFile-${assignment.id}`}
                          type="file"
                          className="visually-hidden-file-input"
                          accept={PROMOTER_UPLOAD_ACCEPT}
                          disabled={
                            isSubmitting || assignment.validationStatus === "validating"
                          }
                          onChange={(event) =>
                            handleBrandAssignmentFileChange(assignment.id, event)
                          }
                        />
                        <label
                          htmlFor={`promoUrlFile-${assignment.id}`}
                          className={`custom-file-control ${
                            assignment.promoFile ? "custom-file-control--selected" : ""
                          } ${assignment.error ? "custom-file-control--error" : ""}`}
                        >
                          <span className="custom-file-icon" aria-hidden="true">
                            {assignment.promoFile ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h6l2 2h8v14H4z" />
                                <path d="M8 13h8" />
                                <path d="M8 17h5" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 3v12" />
                                <path d="m7 8 5-5 5 5" />
                                <path d="M5 21h14" />
                              </svg>
                            )}
                          </span>
                          <span className="custom-file-copy">
                            {assignment.promoFile ? "File selected" : "Choose a file"}
                          </span>
                          {assignment.promoFile ? (
                            <span className="custom-file-replace">Replace</span>
                          ) : null}
                        </label>
                      </div>
                    </div>

                    {assignment.error ? (
                      <p className="brand-upload-message brand-upload-message--error" role="alert">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 7v6" />
                          <path d="M12 17h.01" />
                        </svg>
                        {assignment.error}
                      </p>
                    ) : assignment.promoFile ? (
                      <p className="brand-upload-message brand-upload-message--success">
                        {assignment.validationStatus === "validating" ? (
                          "Checking QR code..."
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <path d="m8 12 3 3 5-6" />
                            </svg>
                            {assignment.promoFile.name} - QR code verified.
                          </>
                        )}
                      </p>
                    ) : (
                      <p className="form-meta-text">
                        JPG, JPEG, PNG, GIF or WEBP, up to 5MB.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="brand-assignment-add"
                disabled={!canAddBrandAssignment || isSubmitting}
                title={
                  canAddBrandAssignment
                    ? "Add another brand"
                    : "Complete the current brand and QR code first"
                }
                onClick={addBrandAssignment}
              >
                <span aria-hidden="true">+</span>
                Add Another Brand
              </button>
            </section>

            <div
              className={`status-toggle ${isPromoterActive ? "status-toggle--active" : "status-toggle--inactive"}`}
            >
              <div className="status-toggle-copy">
                <span className="status-toggle-action">Activate Promoter</span>
                <span className="status-toggle-helper">
                  New promoters are active by default. Switch this off to add the
                  promoter as inactive.
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isPromoterActive}
                  disabled={isSubmitting}
                  onChange={(event) => setIsPromoterActive(event.target.checked)}
                  aria-label="Activate promoter after creation"
                />
                <span className="slider"></span>
              </label>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || isValidatingBrandQr}
            >
              {isSubmitting
                ? "Saving Promoter..."
                : isValidatingBrandQr
                  ? "Validating QR Code..."
                  : "Save Promoter"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
