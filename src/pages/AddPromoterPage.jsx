import React from "react";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  createPromoter as createPromoterRequest,
  getPromoters,
  updatePromoter as updatePromoterRequest,
} from "../api/promoters";
import AppLayout from "../components/AppLayout";
import { validateQrCodeImageUpload } from "../utils/qrCodeValidation";
import { PROMOTER_CODE_LABEL } from "../utils/uiLabels";

const PROMOTER_CODE_PATTERN = /^[A-Z0-9]{5}$/;
const PROMOTER_CODE_MAX_LENGTH = 5;
const PROMOTER_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.svg";
const PROMOTER_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/svg+xml"];

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
  const [promoUrlFile, setPromoUrlFile] = useState(null);
  const [promoUrlValidationStatus, setPromoUrlValidationStatus] = useState("idle");
  const [validatedPromoUrlSignature, setValidatedPromoUrlSignature] = useState("");
  const [promoterIdError, setPromoterIdError] = useState("");
  const [promoUrlFileError, setPromoUrlFileError] = useState("");
  const [isPromoterActive, setIsPromoterActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const promoUrlInputRef = useRef(null);
  const queryClient = useQueryClient();

  const helperCopy =
    `Enter one promo code only. It must contain exactly ${PROMOTER_CODE_MAX_LENGTH} letters or numbers.`;

  const resetForm = () => {
    setPromoterIdInput("");
    setPromoUrlFile(null);
    setPromoUrlValidationStatus("idle");
    setValidatedPromoUrlSignature("");
    setPromoterIdError("");
    setPromoUrlFileError("");
    setIsPromoterActive(true);

    if (promoUrlInputRef.current) {
      promoUrlInputRef.current.value = "";
    }
  };

  const handlePromoUrlChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setPromoUrlFile(null);
      setPromoUrlValidationStatus("idle");
      setValidatedPromoUrlSignature("");
      setPromoUrlFileError("");
      return;
    }

    const validateSelectedPromoUrlFile = async () => {
      setPromoUrlFile(selectedFile);
      setPromoUrlValidationStatus("validating");
      setValidatedPromoUrlSignature("");
      setPromoUrlFileError("");

      const validationResult = await validateQrCodeImageUpload(selectedFile, {
        fileLabel: "Promo URL File",
        allowedMimeTypes: PROMOTER_UPLOAD_MIME_TYPES,
        allowedExtensions: ["jpg", "jpeg", "png", "svg"],
      });

      if (validationResult.error) {
        event.target.value = "";
        setPromoUrlFile(null);
        setPromoUrlValidationStatus("idle");
        setValidatedPromoUrlSignature("");
        setPromoUrlFileError(validationResult.error);
        Swal.fire({
          icon: "error",
          title: "Invalid Promo URL File",
          text: validationResult.error,
          confirmButtonColor: "#d33",
        });
        return;
      }

      setPromoUrlFile(selectedFile);
      setPromoUrlValidationStatus("verified");
      setValidatedPromoUrlSignature(getFileSignature(selectedFile));
    };

    void validateSelectedPromoUrlFile();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedPromoterId = normalizePromoterId(promoterIdInput);
    const validationMessage = getPromoterIdValidationMessage(promoterIdInput);

    setPromoterIdError("");
    setPromoUrlFileError("");

    if (validationMessage) {
      setPromoterIdError(validationMessage);
      return;
    }

    if (!promoUrlFile) {
      setPromoUrlFileError("Promo URL file is required.");
      return;
    }

    if (promoUrlValidationStatus === "validating") {
      setPromoUrlFileError("Please wait while the Promo URL QR code is being validated.");
      return;
    }

    const promoUrlFileSignature = getFileSignature(promoUrlFile);

    if (validatedPromoUrlSignature !== promoUrlFileSignature) {
      setPromoUrlValidationStatus("validating");

      const promoUrlValidationResult = await validateQrCodeImageUpload(promoUrlFile, {
        fileLabel: "Promo URL File",
        allowedMimeTypes: PROMOTER_UPLOAD_MIME_TYPES,
        allowedExtensions: ["jpg", "jpeg", "png", "svg"],
      });

      if (promoUrlValidationResult.error) {
        setPromoUrlValidationStatus("idle");
        setValidatedPromoUrlSignature("");
        setPromoUrlFileError(promoUrlValidationResult.error);
        Swal.fire({
          icon: "error",
          title: "Invalid Promo URL File",
          text: promoUrlValidationResult.error,
          confirmButtonColor: "#d33",
        });
        return;
      }

      setPromoUrlValidationStatus("verified");
      setValidatedPromoUrlSignature(promoUrlFileSignature);
    }

    setIsSubmitting(true);

    try {
      const response = await createPromoterRequest({
        promoter_id: normalizedPromoterId,
        promo_code: normalizedPromoterId,
        promo_URL: promoUrlFile,
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

            <div className="form-group">
              <label htmlFor="promoUrlFile">
                Promo URL File <span className="required-mark">*</span>
              </label>
              <input
                id="promoUrlFile"
                ref={promoUrlInputRef}
                type="file"
                className="file-input"
                accept={PROMOTER_UPLOAD_ACCEPT}
                disabled={isSubmitting || promoUrlValidationStatus === "validating"}
                onChange={handlePromoUrlChange}
              />
              <p className="form-meta-text">
                {promoUrlFile
                  ? promoUrlValidationStatus === "validating"
                    ? `${promoUrlFile.name} - checking QR code...`
                    : `${promoUrlFile.name} - QR code verified.`
                  : "Upload a JPG, PNG, or SVG QR code up to 5MB for promo_URL."}
              </p>
              {promoUrlFileError ? (
                <p className="form-error-text" role="alert">
                  {promoUrlFileError}
                </p>
              ) : null}
            </div>

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
              disabled={isSubmitting || promoUrlValidationStatus === "validating"}
            >
              {isSubmitting
                ? "Saving Promoter..."
                : promoUrlValidationStatus === "validating"
                  ? "Validating QR Code..."
                  : "Save Promoter"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
