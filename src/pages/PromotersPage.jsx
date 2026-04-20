import React from "react";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import {
  usePromoters,
  useResetPromoterPassword,
  useUpdatePromoter,
} from "../hooks/use-promoters";
import { formatLongDate, getPromoterStatusColor } from "../utils/formatters";
import { PROMOTER_CODE_LABEL } from "../utils/uiLabels";

const PAGE_SIZE = 10;

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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="grey" strokeWidth="2">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
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

function getPromoterSortValue(promoter, sortKey) {
  if (sortKey === "createdOn") {
    return promoter.createdOnTime || 0;
  }

  return String(promoter[sortKey] ?? "").toLowerCase();
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
  const [currentPage, setCurrentPage] = useState(0);
  const [sortKey, setSortKey] = useState("createdOn");
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

  const totalPages = Math.max(1, Math.ceil(sortedPromoters.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const paginatedPromoters = sortedPromoters.slice(
    safeCurrentPage * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE + PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, promoters.length]);

  useEffect(() => {
    if (safeCurrentPage !== currentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

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

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editingPromoter) {
      return;
    }

    try {
      await updatePromoter({
        user_id: editingPromoter.id,
        promoter_id: editingPromoter.promoterId,
        first_name: editingPromoter.firstName || "",
        last_name: editingPromoter.lastName || "",
        status: editStatus ? "active" : "inactive",
      });

      setEditingPromoter(null);

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
            <div className="search-bar">
              <SearchIcon />
              <input
                type="text"
                value={searchTerm}
                placeholder="Search promo code..."
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-outer-border">
          <table id="promotersTable" className="data-table">
            <thead>
              <tr>
                <th className="sortable-header">
                  <button
                    type="button"
                    className={`sortable-label is-button${sortKey === "promoterCode" ? ` is-${sortDirection}` : ""}`}
                    onClick={() => handleSort("promoterCode")}
                  >
                    {PROMOTER_CODE_LABEL}
                  </button>
                </th>
                <th className="sortable-header">
                  <button
                    type="button"
                    className={`sortable-label is-button${sortKey === "status" ? ` is-${sortDirection}` : ""}`}
                    onClick={() => handleSort("status")}
                  >
                    Status
                  </button>
                </th>
                <th className="sortable-header">
                  <button
                    type="button"
                    className={`sortable-label is-button${sortKey === "createdOn" ? ` is-${sortDirection}` : ""}`}
                    onClick={() => handleSort("createdOn")}
                  >
                    Date Added
                  </button>
                </th>
                <th className="actions-column">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">Loading promoters...</div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      {error?.message || "Unable to load promoters."}
                    </div>
                  </td>
                </tr>
              ) : paginatedPromoters.length ? (
                paginatedPromoters.map((promoter) => (
                  <tr key={promoter.id}>
                    <td>{promoter.promoterCode || "—"}</td>
                    <td>
                      <span
                        style={{
                          color: getPromoterStatusColor(promoter.status),
                          fontWeight: 700,
                        }}
                      >
                        {promoter.status}
                      </span>
                    </td>
                    <td>{formatLongDate(promoter.createdOn)}</td>
                    <td className="actions-column">
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">No promoters match your search.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <Modal isOpen={Boolean(editingPromoter)} onClose={() => setEditingPromoter(null)}>
        <div className="modal-header">
          <h2>Edit Promoter</h2>
          <button
            type="button"
            className="close-modal"
            onClick={() => setEditingPromoter(null)}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label htmlFor="editId">{PROMOTER_CODE_LABEL}</label>
            <input
              id="editId"
              type="text"
              value={editingPromoter?.promoterCode || ""}
              readOnly
            />
          </div>
          <div
            className={`status-toggle ${isEditingPromoterActive ? "status-toggle--active" : "status-toggle--inactive"}`}
          >
            <div className="status-toggle-copy">
              <span className="status-toggle-action">{editStatusActionLabel}</span>
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
          <button
            type="submit"
            className="update-btn"
            disabled={isUpdatingPromoter || isResettingPromoter}
          >
            {isUpdatingPromoter ? "Updating..." : "Update"}
          </button>
        </form>
      </Modal>
    </AppLayout>
  );
}
