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
import {
  useCreatePromoterBrand,
  useDeletePromoterBrand,
  usePromoterBrands,
  usePromoterBrandsForPromoters,
  useSystemBrands,
  useUpdatePromoterBrand,
} from "../hooks/use-promoters-brands";
import { formatLongDate, getPromoterStatusColor } from "../utils/formatters";
import { validateQrCodeImageUpload } from "../utils/qrCodeValidation";
import { PROMOTER_CODE_LABEL } from "../utils/uiLabels";

const PAGE_SIZE = 10;
const BRAND_QR_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp";
const BRAND_QR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const BRAND_QR_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const NEW_BRAND_EDITOR_ID = "new";

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

function getPromoterSortValue(promoter, sortKey) {
  if (sortKey === "createdOn") {
    return promoter.createdOnTime || 0;
  }

  return String(promoter[sortKey] ?? "").toLowerCase();
}

function normalizeBrandName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function PromoterBrandsCell({ brands, isLoading }) {
  const brandNames = brands.map((brand) => brand.name).filter(Boolean);
  const visibleBrandNames = brandNames.slice(0, 2);
  const hiddenBrandCount = Math.max(0, brandNames.length - visibleBrandNames.length);

  if (isLoading && brandNames.length === 0) {
    return <span className="brand-muted">Loading...</span>;
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
  const [currentPage, setCurrentPage] = useState(0);
  const [sortKey, setSortKey] = useState("createdOn");
  const [sortDirection, setSortDirection] = useState("desc");
  const [editingPromoter, setEditingPromoter] = useState(null);
  const [editStatus, setEditStatus] = useState(false);
  const [resettingPromoterId, setResettingPromoterId] = useState(null);
  const [brandDraftNames, setBrandDraftNames] = useState({});
  const [brandDraftFiles, setBrandDraftFiles] = useState({});
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandFile, setNewBrandFile] = useState(null);
  const [activeBrandEditorId, setActiveBrandEditorId] = useState(null);
  const [brandFileError, setBrandFileError] = useState("");
  const { data: editingPromoterBrands = [], isLoading: isLoadingBrands } =
    usePromoterBrands(editingPromoter?.promoterId, Boolean(editingPromoter));
  const {
    data: systemBrands = [],
    isLoading: isLoadingSystemBrands,
    isError: isSystemBrandsError,
  } = useSystemBrands();
  const { mutateAsync: createPromoterBrand, isPending: isCreatingBrand } =
    useCreatePromoterBrand();
  const { mutateAsync: updatePromoterBrand, isPending: isUpdatingBrand } =
    useUpdatePromoterBrand();
  const { mutateAsync: deletePromoterBrand, isPending: isDeletingBrand } =
    useDeletePromoterBrand();
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
  const visiblePromoterIds = useMemo(
    () => paginatedPromoters.map((promoter) => promoter.promoterId),
    [paginatedPromoters],
  );
  const { brandsByPromoterId, isLoading: isLoadingTableBrands } =
    usePromoterBrandsForPromoters(visiblePromoterIds);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, promoters.length]);

  useEffect(() => {
    if (safeCurrentPage !== currentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  useEffect(() => {
    setBrandDraftNames(
      editingPromoterBrands.reduce((drafts, brand) => {
        drafts[brand.id] = brand.name || "";
        return drafts;
      }, {}),
    );
    setBrandDraftFiles({});
    setActiveBrandEditorId(null);
  }, [editingPromoterBrands]);

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
    setNewBrandName("");
    setNewBrandFile(null);
    setActiveBrandEditorId(null);
    setBrandFileError("");
  };

  const closeEditModal = () => {
    setEditingPromoter(null);
    setNewBrandName("");
    setNewBrandFile(null);
    setBrandDraftNames({});
    setBrandDraftFiles({});
    setActiveBrandEditorId(null);
    setBrandFileError("");
  };

  const isBrandBusy = isCreatingBrand || isUpdatingBrand || isDeletingBrand;

  const openBrandEditor = (brand) => {
    if (activeBrandEditorId) {
      return;
    }

    setBrandDraftNames((currentDrafts) => ({
      ...currentDrafts,
      [brand.id]: brand.name || "",
    }));
    setBrandDraftFiles((currentFiles) => {
      const nextFiles = { ...currentFiles };
      delete nextFiles[brand.id];
      return nextFiles;
    });
    setBrandFileError("");
    setActiveBrandEditorId(String(brand.id));
  };

  const openNewBrandEditor = () => {
    if (activeBrandEditorId) {
      return;
    }

    setNewBrandName("");
    setNewBrandFile(null);
    setBrandFileError("");
    setActiveBrandEditorId(NEW_BRAND_EDITOR_ID);
  };

  const closeBrandEditor = () => {
    if (activeBrandEditorId && activeBrandEditorId !== NEW_BRAND_EDITOR_ID) {
      const activeBrand = editingPromoterBrands.find(
        (brand) => String(brand.id) === activeBrandEditorId,
      );

      if (activeBrand) {
        setBrandDraftNames((currentDrafts) => ({
          ...currentDrafts,
          [activeBrand.id]: activeBrand.name || "",
        }));
        setBrandDraftFiles((currentFiles) => {
          const nextFiles = { ...currentFiles };
          delete nextFiles[activeBrand.id];
          return nextFiles;
        });
      }
    }

    setNewBrandName("");
    setNewBrandFile(null);
    setBrandFileError("");
    setActiveBrandEditorId(null);
  };

  const validateBrandQrFile = async (file) => {
    if (!file) {
      return "";
    }

    const validationResult = await validateQrCodeImageUpload(file, {
      fileLabel: "Brand QR code",
      allowedMimeTypes: BRAND_QR_MIME_TYPES,
      allowedExtensions: BRAND_QR_EXTENSIONS,
    });

    return validationResult.error;
  };

  const handleBrandFileChange = async (brandId, file) => {
    setBrandFileError("");

    if (!file) {
      setBrandDraftFiles((currentFiles) => {
        const nextFiles = { ...currentFiles };
        delete nextFiles[brandId];
        return nextFiles;
      });
      return;
    }

    const validationError = await validateBrandQrFile(file);

    if (validationError) {
      setBrandFileError(validationError);
      return;
    }

    setBrandDraftFiles((currentFiles) => ({
      ...currentFiles,
      [brandId]: file,
    }));
  };

  const handleNewBrandFileChange = async (file) => {
    setBrandFileError("");

    if (!file) {
      setNewBrandFile(null);
      return;
    }

    const validationError = await validateBrandQrFile(file);

    if (validationError) {
      setBrandFileError(validationError);
      setNewBrandFile(null);
      return;
    }

    setNewBrandFile(file);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editingPromoter) {
      return;
    }

    if (activeBrandEditorId) {
      await Swal.fire({
        icon: "warning",
        title: "Brand Draft Open",
        text: "Save or cancel the open brand change before saving the promoter account.",
        confirmButtonColor: "#0E2B63",
      });
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

  const handleAddBrand = async () => {
    const trimmedBrandName = newBrandName.trim();

    if (!editingPromoter || !trimmedBrandName) {
      setBrandFileError("Brand name is required.");
      return;
    }

    const normalizedNewBrandName = normalizeBrandName(trimmedBrandName);
    const hasDuplicateBrand = editingPromoterBrands.some(
      (brand) => normalizeBrandName(brand.name) === normalizedNewBrandName,
    );

    if (hasDuplicateBrand) {
      setBrandFileError("This promoter already belongs to that brand.");
      return;
    }

    try {
      await createPromoterBrand({
        promoterId: editingPromoter.promoterId,
        brandName: trimmedBrandName,
        promoFile: newBrandFile,
      });

      setNewBrandName("");
      setNewBrandFile(null);
      setActiveBrandEditorId(null);
      setBrandFileError("");

      Swal.fire({
        icon: "success",
        title: "Brand Added",
        text: `${trimmedBrandName} has been added to this promoter.`,
        confirmButtonColor: "#22c55e",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (brandError) {
      Swal.fire({
        icon: "error",
        title: "Unable to Add Brand",
        text: brandError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleUpdateBrand = async (brand) => {
    const trimmedBrandName = (brandDraftNames[brand.id] || "").trim();

    if (!editingPromoter || !trimmedBrandName) {
      setBrandFileError("Brand name is required.");
      return;
    }

    const normalizedUpdatedBrandName = normalizeBrandName(trimmedBrandName);
    const hasDuplicateBrand = editingPromoterBrands.some(
      (existingBrand) =>
        String(existingBrand.id) !== String(brand.id) &&
        normalizeBrandName(existingBrand.name) === normalizedUpdatedBrandName,
    );

    if (hasDuplicateBrand) {
      setBrandFileError("This promoter already belongs to that brand.");
      return;
    }

    try {
      await updatePromoterBrand({
        id: brand.id,
        promoterId: editingPromoter.promoterId,
        brandName: trimmedBrandName,
        promoFile: brandDraftFiles[brand.id] || null,
      });

      setBrandDraftFiles((currentFiles) => {
        const nextFiles = { ...currentFiles };
        delete nextFiles[brand.id];
        return nextFiles;
      });
      setActiveBrandEditorId(null);
      setBrandFileError("");

      Swal.fire({
        icon: "success",
        title: "Brand Updated",
        confirmButtonColor: "#22c55e",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (brandError) {
      Swal.fire({
        icon: "error",
        title: "Unable to Update Brand",
        text: brandError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleDeleteBrand = async (brand) => {
    if (!editingPromoter) {
      return;
    }

    const confirmation = await Swal.fire({
      icon: "warning",
      title: `Delete ${brand.name || "this brand"}?`,
      text: "This will remove the brand from this promoter.",
      showCancelButton: true,
      confirmButtonText: "Delete Brand",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#94a3b8",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      await deletePromoterBrand({
        id: brand.id,
        promoterId: editingPromoter.promoterId,
      });

      if (String(brand.id) === activeBrandEditorId) {
        setActiveBrandEditorId(null);
      }

      Swal.fire({
        icon: "success",
        title: "Brand Deleted",
        confirmButtonColor: "#22c55e",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (brandError) {
      Swal.fire({
        icon: "error",
        title: "Unable to Delete Brand",
        text: brandError?.message || "Something went wrong.",
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
                <th>Brands</th>
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
                  <td colSpan="5">
                    <div className="empty-state">Loading promoters...</div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      {error?.message || "Unable to load promoters."}
                    </div>
                  </td>
                </tr>
              ) : paginatedPromoters.length ? (
                paginatedPromoters.map((promoter) => (
                  <tr key={promoter.id}>
                    <td>{promoter.promoterCode || "—"}</td>
                    <td className="brands-column">
                      <PromoterBrandsCell
                        brands={brandsByPromoterId.get(promoter.promoterId) || []}
                        isLoading={isLoadingTableBrands}
                      />
                    </td>
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
                  <td colSpan="5">
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
            aria-label="Close edit promoter modal"
          >
            &times;
          </button>
        </div>

        <form className="promoter-edit-form" onSubmit={handleEditSubmit}>
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
                <h3>Brands</h3>
                <p>
                  Add another brand or move this promoter to a different brand.
                </p>
              </div>
              <BrandIcon />
            </div>
            {isSystemBrandsError ? (
              <p className="brand-file-error" role="alert">
                Unable to load brand names right now.
              </p>
            ) : null}

            {isLoadingBrands ? (
              <p className="edit-promoter-brand-empty">Loading brands...</p>
            ) : editingPromoterBrands.length ? (
              <div className="edit-promoter-brand-list">
                {editingPromoterBrands.map((brand) => {
                  const isEditingBrand = activeBrandEditorId === String(brand.id);
                  const hasOpenBrandEditor = Boolean(activeBrandEditorId);

                  return (
                    <div
                      className={`edit-promoter-brand-row ${
                        isEditingBrand ? "is-editing" : "is-collapsed"
                      }`}
                      key={brand.id}
                    >
                      {isEditingBrand ? (
                        <>
                          <div className="brand-row-main">
                            <label htmlFor={`brandName-${brand.id}`}>Brand</label>
                            <select
                              id={`brandName-${brand.id}`}
                              value={brandDraftNames[brand.id] ?? ""}
                              disabled={isBrandBusy || isLoadingSystemBrands}
                              onChange={(event) =>
                                setBrandDraftNames((currentDrafts) => ({
                                  ...currentDrafts,
                                  [brand.id]: event.target.value,
                                }))
                              }
                            >
                              <option value="">
                                {isLoadingSystemBrands ? "Loading brands..." : "Select brand"}
                              </option>
                              {systemBrands.map((systemBrand) => (
                                <option key={systemBrand.id} value={systemBrand.name}>
                                  {systemBrand.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="brand-row-actions">
                            <label className="brand-file-control">
                              <span>
                                {brandDraftFiles[brand.id]?.name ||
                                  (brand.promoUrl ? "Replace QR" : "Upload QR")}
                              </span>
                              <input
                                type="file"
                                accept={BRAND_QR_ACCEPT}
                                disabled={isBrandBusy}
                                onChange={(event) =>
                                  handleBrandFileChange(
                                    brand.id,
                                    event.target.files?.[0] || null,
                                  )
                                }
                              />
                            </label>
                            {brand.promoUrl ? (
                              <a
                                className="brand-qr-link"
                                href={brand.promoUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View QR
                              </a>
                            ) : null}
                            <button
                              type="button"
                              className="secondary-action-btn brand-save-btn"
                              disabled={isBrandBusy}
                              onClick={() => handleUpdateBrand(brand)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="secondary-action-btn brand-cancel-btn"
                              disabled={isBrandBusy}
                              onClick={closeBrandEditor}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="secondary-action-btn brand-delete-btn"
                              disabled={isBrandBusy}
                              onClick={() => handleDeleteBrand(brand)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
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
                              >
                                View QR
                              </a>
                            ) : null}
                            <button
                              type="button"
                              className="secondary-action-btn brand-save-btn"
                              disabled={hasOpenBrandEditor || isBrandBusy}
                              onClick={() => openBrandEditor(brand)}
                              title={
                                hasOpenBrandEditor
                                  ? "Save or cancel the open brand editor first"
                                  : "Edit brand"
                              }
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="secondary-action-btn brand-delete-btn"
                              disabled={hasOpenBrandEditor || isBrandBusy}
                              onClick={() => handleDeleteBrand(brand)}
                              title={
                                hasOpenBrandEditor
                                  ? "Save or cancel the open brand editor first"
                                  : "Delete brand"
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="edit-promoter-brand-empty">No brands added yet.</p>
            )}

            {activeBrandEditorId === NEW_BRAND_EDITOR_ID ? (
              <div className="edit-promoter-brand-add is-editing">
                <div className="brand-row-main">
                  <label htmlFor="newBrandName">New Brand</label>
                  <select
                    id="newBrandName"
                    value={newBrandName}
                    disabled={isBrandBusy || isLoadingSystemBrands}
                    onChange={(event) => setNewBrandName(event.target.value)}
                  >
                    <option value="">
                      {isLoadingSystemBrands ? "Loading brands..." : "Select brand"}
                    </option>
                    {systemBrands.map((brand) => (
                      <option key={brand.id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="brand-row-actions">
                  <label className="brand-file-control">
                    <span>{newBrandFile?.name || "Upload QR"}</span>
                    <input
                      type="file"
                      accept={BRAND_QR_ACCEPT}
                      disabled={isBrandBusy}
                      onChange={(event) =>
                        handleNewBrandFileChange(event.target.files?.[0] || null)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="secondary-action-btn brand-save-btn"
                    disabled={isBrandBusy}
                    onClick={handleAddBrand}
                  >
                    {isCreatingBrand ? "Adding..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="secondary-action-btn brand-cancel-btn"
                    disabled={isBrandBusy}
                    onClick={closeBrandEditor}
                  >
                    Cancel
                  </button>
                </div>
                {brandFileError ? (
                  <p className="brand-file-error" role="alert">
                    {brandFileError}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="brand-add-closed">
                <button
                  type="button"
                  className="secondary-action-btn brand-add-btn"
                  disabled={Boolean(activeBrandEditorId) || isBrandBusy}
                  onClick={openNewBrandEditor}
                  title={
                    activeBrandEditorId
                      ? "Save or cancel the open brand editor first"
                      : "Add another brand"
                  }
                >
                  Add Brand
                </button>
              </div>
            )}

            {brandFileError && activeBrandEditorId !== NEW_BRAND_EDITOR_ID ? (
              <p className="brand-file-error" role="alert">
                {brandFileError}
              </p>
            ) : null}
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
