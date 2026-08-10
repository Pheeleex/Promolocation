import React from "react";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import {
  usePromoters,
  useResetPromoterPassword,
  useUpdatePromoter,
} from "../hooks/use-promoters";
import {
  usePromoterBrands,
} from "../hooks/use-promoters-brands";
import { formatLongDate, getPromoterStatusColor } from "../utils/formatters";
import { PROMOTER_CODE_LABEL } from "../utils/uiLabels";

function isPromoterRole(role) {
  const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";

  return normalizedRole === "promoter" || normalizedRole === "user";
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 21a8 8 0 0 1 10.821-7.487" />
      <path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
      <circle cx="10" cy="8" r="5" />
    </svg>
  );
}

function ResetPasswordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 8V6a4 4 0 1 0-8 0v2" />
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M12 12v4" />
      <path d="M10.5 14h3" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function getFileNameFromUrl(url) {
  if (!url) return "";
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    return pathname.substring(pathname.lastIndexOf("/") + 1);
  } catch (e) {
    // Fallback if url is a relative path or partial string
    const segments = url.split("/");
    return segments[segments.length - 1] || url;
  }
}

function getPromoterSortValue(promoter, sortKey) {
  if (sortKey === "createdOn") {
    return promoter.createdOnTime || 0;
  }

  if (sortKey === "lastUpdated") {
    return promoter.lastUpdatedTime || 0;
  }

  return String(promoter[sortKey] ?? "").toLowerCase();
}

function PromoterBrandsCell({ promoterId }) {
  const {
    data: activeBrands = [],
    isLoading,
    isError,
  } = usePromoterBrands(promoterId, Boolean(promoterId));
  const brandNames = activeBrands.map((brand) => brand.name).filter(Boolean);
  const visibleBrandNames = brandNames.slice(0, 2);
  const hiddenBrandCount = Math.max(0, brandNames.length - visibleBrandNames.length);

  if (isLoading) {
    return <span className="brand-muted">Loading...</span>;
  }

  if (isError) {
    return <span className="brand-muted">--</span>;
  }

  if (brandNames.length === 0) {
    return <span className="brand-muted">--</span>;
  }

  return (
    <div className="brand-chip-list" title={brandNames.join(", ")}>
      {visibleBrandNames.map((brandName) => (
        <span className="brand-chip" key={brandName}>
          {brandName}
        </span>
      ))}
      {hiddenBrandCount > 0 ? (
        <span className="brand-chip brand-chip-more">+{hiddenBrandCount}</span>
      ) : null}
    </div>
  );
}

export default function PromotersPage() {
  const { data: fetchedPromoters = [], isLoading, isError, error } = usePromoters();
  const { mutateAsync: updatePromoter, isPending: isUpdatingPromoter } =
    useUpdatePromoter();
  const {
    mutateAsync: resetPromoterPassword,
    isPending: isResettingPromoter,
  } = useResetPromoterPassword();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("lastUpdated");
  const [sortDirection, setSortDirection] = useState("desc");
  const [editingPromoter, setEditingPromoter] = useState(null);
  const [editStatus, setEditStatus] = useState(false);
  const [resettingPromoterId, setResettingPromoterId] = useState(null);
  const isEditingPromoterActive = editStatus;
  const editStatusActionLabel = isEditingPromoterActive ? "Deactivate" : "Activate";
  const editStatusHelperCopy = isEditingPromoterActive
    ? "Switch this off if you want to deactivate the account."
    : "Switch this on if you want to reactivate the account.";

  const promoters = useMemo(
    () => fetchedPromoters.filter((promoter) => isPromoterRole(promoter.role)),
    [fetchedPromoters],
  );

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredPromoters = promoters.filter((promoter) =>
    [promoter.promoterCode, promoter.fullName, promoter.status]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm),
  );

  const sortedPromoters = [...filteredPromoters].sort((left, right) => {
    const leftValue = getPromoterSortValue(left, sortKey);
    const rightValue = getPromoterSortValue(right, sortKey);

    if (leftValue < rightValue) {
      return sortDirection === "asc" ? -1 : 1;
    }

    if (leftValue > rightValue) {
      return sortDirection === "asc" ? 1 : -1;
    }

    return 0;
  });

  const {
    data: editingPromoterBrands = [],
    isLoading: isLoadingBrands,
  } = usePromoterBrands(
    editingPromoter?.promoterId || "",
    Boolean(editingPromoter?.promoterId),
  );

  useEffect(() => {
    if (!editingPromoter?.id) {
      return;
    }

    const refreshedPromoter = fetchedPromoters.find(
      (promoter) => promoter.id === editingPromoter.id,
    );

    if (refreshedPromoter) {
      setEditingPromoter(refreshedPromoter);
    }
  }, [editingPromoter?.id, fetchedPromoters]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc",
      );
      return;
    }

    setSortKey(key);
    setSortDirection(key === "createdOn" ? "desc" : "asc");
  };

  const openEditModal = (promoter) => {
    setEditingPromoter(promoter);
    setEditStatus(promoter.status === "Active");
  };

  const closeEditModal = () => {
    setEditingPromoter(null);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (isUpdatingPromoter) {
      return;
    }

    if (!editingPromoter) {
      return;
    }

    try {
      await updatePromoter({
        user_id: editingPromoter.id,
        user_role: editingPromoter.role || "user",
        promoter_id: editingPromoter.promoterId,
        first_name: editingPromoter.firstName || "",
        last_name: editingPromoter.lastName || "",
        status: editStatus ? "active" : "inactive",
      });

      closeEditModal();

      Swal.fire({
        icon: "success",
        title: "Promoter Updated Successfully!",
        confirmButtonColor: "#22c55e",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (updateError) {
      Swal.fire({
        icon: "error",
        title: "Unable to Update Promoter",
        text: updateError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleResetPassword = async (promoter) => {
    if (isResettingPromoter || isUpdatingPromoter) {
      return;
    }

    const displayedPromoterCode = promoter.promoterCode || "this promoter";

    const confirmation = await Swal.fire({
      icon: "question",
      title: `Reset password for ${displayedPromoterCode}?`,
      text: "This will send a password reset request for this promoter.",
      showCancelButton: true,
      confirmButtonText: "Reset Password",
      confirmButtonColor: "#0E2B63",
      cancelButtonColor: "#94a3b8",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setResettingPromoterId(promoter.id);

    try {
      const response = await resetPromoterPassword({
        user_id: promoter.id,
      });

      Swal.fire({
        icon: "success",
        title: "Password Reset Sent",
        text:
          response.message ||
          `Password reset request sent for ${displayedPromoterCode}.`,
        confirmButtonColor: "#22c55e",
      });
    } catch (resetError) {
      Swal.fire({
        icon: "error",
        title: "Unable to Reset Password",
        text: resetError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setResettingPromoterId(null);
    }
  };

  return (
    <AppLayout activeNav="promoters" mainContentClassName="promoters-main">
      <div className="main-card">
        <div className="card-header">
          <h2>Promoters Management</h2>
          <div className="search-section">
            <SearchBar
              ariaLabel="Search promoters"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search promo code..."
            />
          </div>
        </div>

        <DataTable
          columns={[
            {
              header: (
                <button
                  type="button"
                  className={`sortable-label is-button${sortKey === "promoterCode" ? ` is-${sortDirection}` : ""}`}
                  onClick={() => handleSort("promoterCode")}
                >
                  {PROMOTER_CODE_LABEL}
                </button>
              ),
              headerClassName: "sortable-header",
              key: "promoterCode",
              render: (promoter) => promoter.promoterCode || "—",
            },
            {
              cellClassName: "brands-column",
              header: "Brands",
              key: "brands",
              render: (promoter) => (
                <PromoterBrandsCell promoterId={promoter.promoterId} />
              ),
            },
            {
              header: (
                <button
                  type="button"
                  className={`sortable-label is-button${sortKey === "status" ? ` is-${sortDirection}` : ""}`}
                  onClick={() => handleSort("status")}
                >
                  Status
                </button>
              ),
              headerClassName: "sortable-header",
              key: "status",
              render: (promoter) => (
                <span
                  style={{
                    color: getPromoterStatusColor(promoter.status),
                    fontWeight: 700,
                  }}
                >
                  {promoter.status}
                </span>
              ),
            },
            {
              header: (
                <button
                  type="button"
                  className={`sortable-label is-button${sortKey === "createdOn" ? ` is-${sortDirection}` : ""}`}
                  onClick={() => handleSort("createdOn")}
                >
                  Date Added
                </button>
              ),
              headerClassName: "sortable-header",
              key: "createdOn",
              render: (promoter) => formatLongDate(promoter.createdOn),
            },
            {
              header: (
                <button
                  type="button"
                  className={`sortable-label is-button${sortKey === "lastUpdated" ? ` is-${sortDirection}` : ""}`}
                  onClick={() => handleSort("lastUpdated")}
                >
                  Last Updated
                </button>
              ),
              headerClassName: "sortable-header",
              key: "lastUpdated",
              render: (promoter) => formatLongDate(promoter.lastUpdated),
            },
            {
              cellClassName: "actions-column",
              header: "Action",
              headerClassName: "actions-column",
              key: "actions",
              render: (promoter) => (
                <div className="action-icons">
                  <button
                    type="button"
                    className="icon-btn icon-edit"
                    title="Edit"
                    onClick={() => openEditModal(promoter)}
                  >
                    <PencilIcon />
                  </button>
                </div>
              ),
            },
          ]}
          dependencies={[
            searchTerm,
            promoters.length,
            sortKey,
            sortDirection,
          ]}
          emptyMessage="No promoters match your search."
          error={error}
          errorMessage="Unable to load promoters."
          getRowKey={(promoter) => promoter.id}
          isError={isError}
          isLoading={isLoading}
          items={sortedPromoters}
          loadingMessage="Loading promoters..."
          tableId="promotersTable"
        />
      </div>

      <Modal
        isOpen={Boolean(editingPromoter)}
        onClose={closeEditModal}
        contentClassName="modal-content promoter-edit-modal"
      >
        <div className="modal-header promoter-edit-header">
          <div>
            <p className="modal-eyebrow">Promoter</p>
            <h2>Edit {editingPromoter?.promoterCode || "Promoter"}</h2>
          </div>
          <button
            type="button"
            className="close-modal"
            onClick={closeEditModal}
            disabled={isUpdatingPromoter}
            aria-label="Close edit promoter modal"
          >
            &times;
          </button>
        </div>

        <form className="promoter-edit-form" onSubmit={handleEditSubmit} noValidate>
          <div className="promoter-edit-summary">
            <div>
              <span className="promoter-edit-summary-label">{PROMOTER_CODE_LABEL}</span>
              <strong>{editingPromoter?.promoterCode || "--"}</strong>
            </div>
            <span
              className={`promoter-edit-status-pill ${
                isEditingPromoterActive ? "is-active" : "is-inactive"
              }`}
            >
              {isEditingPromoterActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div
            className={`status-toggle ${isEditingPromoterActive ? "status-toggle--active" : "status-toggle--inactive"}`}
          >
            <div className="status-toggle-copy">
              <span className="status-toggle-action">Account Status</span>
              <span className="status-toggle-helper">{editStatusHelperCopy}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={editStatus}
                disabled={isUpdatingPromoter}
                onChange={(event) => setEditStatus(event.target.checked)}
                aria-label={`${editStatusActionLabel} promoter account`}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="edit-promoter-brands-panel">
            <div className="edit-promoter-brands-header">
              <div>
                <h3>Active Promotion Brands</h3>
                <p>
                  Brands are shown only when this promoter is assigned to an active
                  promotion.
                </p>
              </div>
              <BrandIcon />
            </div>

            {isLoadingBrands ? (
              <p className="edit-promoter-brand-empty">Loading brands...</p>
            ) : editingPromoterBrands.length ? (
              <div className="edit-promoter-brand-list">
                {editingPromoterBrands.map((brand) => {
                  const fileName = getFileNameFromUrl(brand.promoUrl);

                  return (
                    <div className="edit-promoter-brand-row is-collapsed" key={brand.id}>
                      <div className="brand-collapsed-copy">
                        <span className="brand-name">{brand.name || "Untitled brand"}</span>
                        <span className="brand-qr-status">
                          {brand.promoUrl ? "QR code attached" : "No QR code"}
                        </span>
                      </div>
                      <div className="brand-row-actions">
                        {brand.promoUrl ? (
                          <a
                            className="brand-qr-link"
                            href={brand.promoUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={fileName}
                          >
                            <span className="brand-qr-filename">{fileName}</span>
                            <ExternalLinkIcon />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="edit-promoter-brand-empty">
                No active promotion brands assigned.
              </p>
            )}
          </div>
          <div className="edit-promoter-password-panel">
            <div>
              <p className="edit-promoter-panel-title">Password</p>
              <p className="edit-promoter-panel-copy">
                Trigger a password reset for {editingPromoter?.promoterCode || "this promoter"}.
              </p>
            </div>
            <button
              type="button"
              className="secondary-action-btn"
              disabled={isResettingPromoter || isUpdatingPromoter}
              onClick={() => handleResetPassword(editingPromoter)}
            >
              <ResetPasswordIcon />
              <span>
                {isResettingPromoter &&
                resettingPromoterId === editingPromoter?.id
                  ? "Resetting..."
                  : "Reset Password"}
              </span>
            </button>
          </div>
          <div className="promoter-edit-footer">
            <button
              type="button"
              className="secondary-action-btn"
              onClick={closeEditModal}
              disabled={isUpdatingPromoter}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="update-btn"
              disabled={isUpdatingPromoter || isResettingPromoter}
            >
              {isUpdatingPromoter ? "Updating..." : "Save Account"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}