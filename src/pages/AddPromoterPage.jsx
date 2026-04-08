import React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { createPromoter as createPromoterRequest } from "../api/promoters";
import AppLayout from "../components/AppLayout";
import { usePromoters } from "../hooks/use-promoters";

const DEFAULT_PROMOTER_ROLE = "Promoter";
const PROMOTER_ID_PATTERN = /^PROMO\d+$/;

function normalizePromoterId(value) {
  return value.trim().toUpperCase();
}

function getPromoterIdValidationMessage(value) {
  const normalizedPromoterId = normalizePromoterId(value);

  if (!normalizedPromoterId) {
    return "Promoter ID is required.";
  }

  if (!PROMOTER_ID_PATTERN.test(normalizedPromoterId)) {
    return "Use the format PROMO followed by digits only, for example PROMO001.";
  }

  return "";
}

export default function AddPromoterPage() {
  const [promoterIdInput, setPromoterIdInput] = useState("");
  const [promoterIdError, setPromoterIdError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: promoters = [], isLoading: isLoadingPromoters } = usePromoters();
  const queryClient = useQueryClient();

  const helperCopy =
    "Enter one promoter ID only. It must start with PROMO and the remaining characters must be digits, for example PROMO001.";

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedPromoterId = normalizePromoterId(promoterIdInput);
    const validationMessage = getPromoterIdValidationMessage(promoterIdInput);

    if (validationMessage) {
      setPromoterIdError(validationMessage);
      return;
    }

    const promoterIdAlreadyExists = promoters.some(
      (promoter) =>
        promoter.promoterId.toLowerCase() === normalizedPromoterId.toLowerCase(),
    );

    if (promoterIdAlreadyExists) {
      setPromoterIdError(`${normalizedPromoterId} already exists.`);
      return;
    }

    setPromoterIdError("");
    setIsSubmitting(true);

    try {
      await createPromoterRequest({
        promoter_id: normalizedPromoterId,
        first_name: "",
        last_name: "",
        user_role: DEFAULT_PROMOTER_ROLE,
      });

      try {
        await queryClient.invalidateQueries({ queryKey: ["promoters"] });
      } catch {
        // Keep the save flow successful even if the background refresh misses once.
      }

      setPromoterIdInput("");

      Swal.fire({
        icon: "success",
        title: "Promoter Added Successfully!",
        text: `${normalizedPromoterId} has been added.`,
        confirmButtonColor: "#22c55e",
      });
    } catch (error) {
      const errorMessage =
        error?.message || "Unable to add promoter right now. Please try again.";

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
                Promoter ID <span className="required">*</span>
              </label>
              <p className="form-helper-text">{helperCopy}</p>
              <input
                id="promoterId"
                type="text"
                className={`promoter-id-input${promoterIdError ? " input-error" : ""}`}
                placeholder="PROMO001"
                value={promoterIdInput}
                disabled={isSubmitting || isLoadingPromoters}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                aria-invalid={Boolean(promoterIdError)}
                aria-describedby={promoterIdError ? "promoterId-error" : "promoterId-help"}
                onChange={(event) => {
                  setPromoterIdInput(event.target.value.toUpperCase());
                  setPromoterIdError("");
                }}
              />
              {promoterIdError ? (
                <p id="promoterId-error" className="form-error-text" role="alert">
                  {promoterIdError}
                </p>
              ) : (
                <p id="promoterId-help" className="form-meta-text">
                  {isLoadingPromoters
                    ? "Checking existing promoter IDs..."
                    : ""}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || isLoadingPromoters}
            >
              {isSubmitting ? "Saving Promoter..." : "Save Promoter"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
