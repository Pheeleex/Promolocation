import React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  createPromoter as createPromoterRequest,
  getPromoters,
  updatePromoter as updatePromoterRequest,
} from "../api/promoters";
import AppLayout from "../components/AppLayout";
import { FormErrorSummary } from "../components/FormControls";
import { PROMOTER_CODE_LABEL } from "../utils/uiLabels";

const PROMOTER_CODE_PATTERN = /^[A-Z0-9]{5}$/;
const PROMOTER_CODE_MAX_LENGTH = 5;

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

export default function AddPromoterPage() {
  const [promoterIdInput, setPromoterIdInput] = useState("");
  const [formErrors, setFormErrors] = useState([]);
  const [isPromoterActive, setIsPromoterActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const helperCopy =
    `Enter one promo code only. It must contain exactly ${PROMOTER_CODE_MAX_LENGTH} letters or numbers.`;

  const resetForm = () => {
    setPromoterIdInput("");
    setFormErrors([]);
    setIsPromoterActive(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedPromoterId = normalizePromoterId(promoterIdInput);
    const validationMessage = getPromoterIdValidationMessage(promoterIdInput);

    setFormErrors([]);

    if (validationMessage) {
      setFormErrors([validationMessage]);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createPromoterRequest({
        promoter_id: normalizedPromoterId,
        promo_code: normalizedPromoterId,
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

      setFormErrors([errorMessage]);

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
        <div className="add-promoter-view-switch" aria-label="Add promoter method">
          <Link to="/promoters/new" className="is-active" aria-current="page">
            Manual Entry
          </Link>
        </div>

        <div className="form-card">
          <div className="form-header">
            <span className="close-form">x</span>
          </div>

          <form id="addPromoterForm" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="promoterId">
                {PROMOTER_CODE_LABEL} <span className="required-mark">*</span>
              </label>
              <p className="form-helper-text">{helperCopy}</p>
              <input
                id="promoterId"
                type="text"
                className="promoter-id-input"
                placeholder="A1B2C"
                value={promoterIdInput}
                disabled={isSubmitting}
                maxLength={PROMOTER_CODE_MAX_LENGTH}
                pattern="[A-Za-z0-9]{5}"
                autoCorrect="off"
                spellCheck="false"
                aria-invalid={Boolean(formErrors.length)}
                aria-describedby="promoterId-help"
                onChange={(event) => {
                  setPromoterIdInput(normalizePromoterId(event.target.value));
                  setFormErrors([]);
                }}
              />
              <p id="promoterId-help" className="form-meta-text">
                {`Use exactly ${PROMOTER_CODE_MAX_LENGTH} letters or numbers.`}
              </p>
            </div>

            <FormErrorSummary errors={formErrors} />

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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving Promoter..." : "Save Promoter"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
