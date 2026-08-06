import React from "react";
import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";
import { FormErrorSummary } from "../components/FormControls";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import {
  useCreateSystemBrand,
  useDeleteSystemBrand,
  useManagedSystemBrands,
  useUpdateSystemBrand,
} from "../hooks/use-promoters-brands";
import { validateImageUpload } from "../utils/imageUploadValidation";

const BRAND_LOGO_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.svg";
const BRAND_LOGO_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
const EMPTY_FORM = {
  brandName: "",
  brandImage: null,
  isActive: true,
};

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
  const [formErrors, setFormErrors] = useState([]);
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
  const openCreateModal = () => {
    setEditingBrand({ mode: "create" });
    setForm(EMPTY_FORM);
    setFormErrors([]);
    setPreviewUrl("");
  };

  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setForm({
      brandName: brand.name,
      brandImage: null,
      isActive: brand.isActive !== false,
    });
    setFormErrors([]);
    setPreviewUrl("");
  };

  const closeModal = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setEditingBrand(null);
    setForm(EMPTY_FORM);
    setFormErrors([]);
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

    setFormErrors([]);
    setForm((currentForm) => ({ ...currentForm, brandImage: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const brandName = form.brandName.trim();
    const validationErrors = [];

    if (!brandName) {
      validationErrors.push("Brand name is required.");
    }

    if (isCreating && !form.brandImage) {
      validationErrors.push("Brand logo is required.");
    }

    if (form.brandImage) {
      const logoValidationError = validateImageUpload(form.brandImage, {
        allowedExtensions: BRAND_LOGO_EXTENSIONS,
        fileLabel: "Brand logo",
      });

      if (logoValidationError) {
        validationErrors.push(logoValidationError);
      }
    }

    if (validationErrors.length) {
      setFormErrors(validationErrors);
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
          <SearchBar
            ariaLabel="Search brands"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search brands"
          />
          <span className="brands-admin-count">
            {filteredBrands.length} of {brands.length} brands
          </span>
        </div>

        <DataTable
          columns={[
            {
              header: "Brand",
              key: "brand",
              render: (brand) => (
                <div className="brand-admin-name-cell">
                  <BrandLogoPreview brand={brand} />
                  <div>
                    <strong>{brand.name}</strong>
                    <span>{brand.logoUrl ? "Logo available" : "No logo"}</span>
                  </div>
                </div>
              ),
            },
            {
              header: "Status",
              key: "status",
              render: (brand) => (
                <span
                  className={`brand-admin-status ${
                    brand.isActive === false ? "is-inactive" : "is-active"
                  }`}
                >
                  {brand.isActive === false ? "Inactive" : "Active"}
                </span>
              ),
            },
            {
              header: "Created",
              key: "created",
              render: (brand) => formatBrandDate(brand.createdAt),
            },
            {
              header: "Updated",
              key: "updated",
              render: (brand) => formatBrandDate(brand.updatedAt),
            },
            {
              cellClassName: "actions-column",
              header: "Actions",
              headerClassName: "actions-column",
              key: "actions",
              render: (brand) => (
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
              ),
            },
          ]}
          dependencies={[searchTerm, brands.length]}
          emptyMessage="No brands found."
          error={error}
          errorMessage="Unable to load brands right now."
          getRowKey={(brand) => brand.id}
          isError={isError}
          isLoading={isLoading}
          items={filteredBrands}
          loadingMessage="Loading brands..."
          tableClassName="data-table brands-admin-table"
        />
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

        <form className="brand-admin-form" onSubmit={handleSubmit} noValidate>
          <div className="brand-admin-logo-panel">
            <BrandLogoPreview
              brand={{
                name: form.brandName,
                logoUrl: isCreating ? null : editingBrand?.logoUrl,
              }}
              previewUrl={previewUrl}
            />
            <div>
              <label htmlFor="brandLogo">
                Brand Logo {isCreating ? <span className="required-mark">*</span> : null}
              </label>
              <input
                id="brandLogo"
                type="file"
                accept={BRAND_LOGO_ACCEPT}
                disabled={isSaving}
                onChange={handleLogoChange}
              />
              <p>Only JPG, PNG, SVG, AVIF and other image extension files allowed. Max 3MB.</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="brandName">Brand Name <span className="required-mark">*</span></label>
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
                setFormErrors([]);
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

          <FormErrorSummary errors={formErrors} />

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
