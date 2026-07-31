import React from "react";
import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import {
  useCreateSystemBrand,
  useDeleteSystemBrand,
  useManagedSystemBrands,
  useUpdateSystemBrand,
} from "../hooks/use-promoters-brands";
import { useTablePagination } from "../hooks/use-table-pagination";
import { validateImageUpload } from "../utils/imageUploadValidation";

const BRAND_LOGO_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.svg";
const BRAND_LOGO_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
const EMPTY_FORM = {
  brandName: "",
  brandImage: null,
  isActive: true,
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="grey" strokeWidth="2">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function BrandLogoPreview({ brand, previewUrl }) {
  const logoUrl = previewUrl || brand?.logoUrl;
  const initial = String(brand?.name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <span className="brand-admin-logo" aria-hidden="true">
      {logoUrl ? <img src={logoUrl} alt="" /> : <span>{initial}</span>}
    </span>
  );
}

function formatBrandDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function BrandsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const {
    data: brands = [],
    isLoading,
    isError,
    error,
  } = useManagedSystemBrands();
  const { mutateAsync: createBrand, isPending: isCreatingBrand } =
    useCreateSystemBrand();
  const { mutateAsync: updateBrand, isPending: isUpdatingBrand } =
    useUpdateSystemBrand();
  const { mutateAsync: deleteBrand, isPending: isDeletingBrand } =
    useDeleteSystemBrand();
  const isSaving = isCreatingBrand || isUpdatingBrand;
  const isModalOpen = editingBrand !== null;
  const isCreating = editingBrand?.mode === "create";

  const filteredBrands = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return brands;
    }

    return brands.filter((brand) =>
      [brand.name, brand.isActive === false ? "inactive" : "active"]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm),
    );
  }, [brands, searchTerm]);
  const {
    currentPage,
    paginatedItems: paginatedBrands,
    setCurrentPage,
    totalPages,
  } = useTablePagination(filteredBrands, [searchTerm, brands.length]);

  const openCreateModal = () => {
    setEditingBrand({ mode: "create" });
    setForm(EMPTY_FORM);
    setFormError("");
    setPreviewUrl("");
  };

  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setForm({
      brandName: brand.name,
      brandImage: null,
      isActive: brand.isActive !== false,
    });
    setFormError("");
    setPreviewUrl("");
  };

  const closeModal = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setEditingBrand(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setPreviewUrl("");
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setForm((currentForm) => ({ ...currentForm, brandImage: null }));
      setPreviewUrl("");
      return;
    }

    const validationError = validateImageUpload(file, {
      allowedExtensions: BRAND_LOGO_EXTENSIONS,
      fileLabel: "Brand logo",
    });

    if (validationError) {
      setFormError(validationError);
      event.target.value = "";
      setForm((currentForm) => ({ ...currentForm, brandImage: null }));
      setPreviewUrl("");
      return;
    }

    setFormError("");
    setForm((currentForm) => ({ ...currentForm, brandImage: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const brandName = form.brandName.trim();

    if (!brandName) {
      setFormError("Brand name is required.");
      return;
    }

    if (isCreating && !form.brandImage) {
      setFormError("Brand logo is required.");
      return;
    }

    try {
      if (isCreating) {
        await createBrand({
          brandName,
          brandImage: form.brandImage,
          isActive: form.isActive,
        });
      } else {
        await updateBrand({
          id: editingBrand.id,
          brandName,
          brandImage: form.brandImage,
          isActive: form.isActive,
        });
      }

      await Swal.fire({
        icon: "success",
        title: isCreating ? "Brand Created" : "Brand Updated",
        text: `${brandName} is ready to use.`,
        confirmButtonColor: "#22c55e",
      });

      closeModal();
    } catch (submitError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Save Brand",
        text: submitError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleDeleteBrand = async (brand) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Brand?",
      text: `This will remove ${brand.name} from the system brand list.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteBrand({ id: brand.id });

      await Swal.fire({
        icon: "success",
        title: "Brand Deleted",
        text: `${brand.name} was removed.`,
        confirmButtonColor: "#22c55e",
      });
    } catch (deleteError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Delete Brand",
        text: deleteError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <AppLayout activeNav="brands">
      <div className="main-card brands-admin-card">
        <div className="card-header brands-admin-header">
          <div>
            <p className="brands-admin-eyebrow">Brand Setup</p>
            <h2>Manage Brands</h2>
            <p>
              Create and update the system brands that appear in promoter brand
              dropdowns.
            </p>
          </div>
          <button type="button" className="brand-admin-primary-btn" onClick={openCreateModal}>
            Add Brand
          </button>
        </div>

        <div className="brands-admin-toolbar">
          <div className="search-bar">
            <SearchIcon />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search brands"
            />
          </div>
          <span className="brands-admin-count">
            {filteredBrands.length} of {brands.length} brands
          </span>
        </div>

        {isError ? (
          <div className="brands-admin-state" role="alert">
            {error?.message || "Unable to load brands right now."}
          </div>
        ) : (
          <div className="table-outer-border">
            <table className="data-table brands-admin-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="brands-admin-empty">
                      Loading brands...
                    </td>
                  </tr>
                ) : paginatedBrands.length ? (
                  paginatedBrands.map((brand) => (
                    <tr key={brand.id}>
                      <td>
                        <div className="brand-admin-name-cell">
                          <BrandLogoPreview brand={brand} />
                          <div>
                            <strong>{brand.name}</strong>
                            <span>{brand.logoUrl ? "Logo available" : "No logo"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`brand-admin-status ${
                            brand.isActive === false ? "is-inactive" : "is-active"
                          }`}
                        >
                          {brand.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td>{formatBrandDate(brand.createdAt)}</td>
                      <td>{formatBrandDate(brand.updatedAt)}</td>
                      <td className="actions-column">
                        <div className="brand-admin-actions">
                          <button type="button" onClick={() => openEditModal(brand)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="is-danger"
                            disabled={isDeletingBrand}
                            onClick={() => handleDeleteBrand(brand)}
                          >
                            {isDeletingBrand ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="brands-admin-empty">
                      No brands found.
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        contentClassName="modal-content brand-admin-modal"
      >
        <div className="modal-header promoter-edit-header">
          <div>
            <p className="modal-eyebrow">Brand</p>
            <h2>{isCreating ? "Create Brand" : "Edit Brand"}</h2>
          </div>
          <button
            type="button"
            className="close-modal"
            aria-label="Close brand modal"
            disabled={isSaving}
            onClick={closeModal}
          >
            &times;
          </button>
        </div>

        <form className="brand-admin-form" onSubmit={handleSubmit}>
          <div className="brand-admin-logo-panel">
            <BrandLogoPreview
              brand={{
                name: form.brandName,
                logoUrl: isCreating ? null : editingBrand?.logoUrl,
              }}
              previewUrl={previewUrl}
            />
            <div>
              <label htmlFor="brandLogo">Brand Logo</label>
              <input
                id="brandLogo"
                type="file"
                accept={BRAND_LOGO_ACCEPT}
                disabled={isSaving}
                onChange={handleLogoChange}
              />
              <p>Use a square or wide transparent logo when available.</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="brandName">Brand Name</label>
            <input
              id="brandName"
              type="text"
              value={form.brandName}
              disabled={isSaving}
              onChange={(event) => {
                setForm((currentForm) => ({
                  ...currentForm,
                  brandName: event.target.value,
                }));
                setFormError("");
              }}
              placeholder="Brand name"
            />
          </div>

          <label
            className={`status-toggle ${
              form.isActive ? "status-toggle--active" : "status-toggle--inactive"
            }`}
          >
            <span className="status-toggle-copy">
              <span className="status-toggle-action">
                {form.isActive ? "Active" : "Inactive"}
              </span>
              <span className="status-toggle-helper">
                Active brands can appear in promoter brand dropdowns.
              </span>
            </span>
            <span className="switch">
              <input
                type="checkbox"
                checked={form.isActive}
                disabled={isSaving}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    isActive: event.target.checked,
                  }))
                }
              />
              <span className="slider" />
            </span>
          </label>

          {formError ? (
            <p className="form-error-text" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="brand-admin-form-actions">
            <button
              type="button"
              className="brand-admin-secondary-btn"
              disabled={isSaving}
              onClick={closeModal}
            >
              Cancel
            </button>
            <button type="submit" className="brand-admin-primary-btn" disabled={isSaving}>
              {isSaving ? "Saving..." : isCreating ? "Create Brand" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
