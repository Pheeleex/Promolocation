import React from "react";
import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import Modal from "../components/Modal";
import {
  useCreatePromotion,
  useDeletePromotion,
  usePromotions,
  useUpdatePromotion,
  useUploadPromotionQrCodesBulk,
} from "../hooks/use-promotions";
import { useImportBrandsCategory } from "../hooks/use-promoters-brands";

const EMPTY_PROMOTION_FORM = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "draft",
  promotionImage: null,
};
const PROMOTION_UPLOAD_FILE_BASENAME = "Promotion Management";
const PROMOTION_UPLOAD_ACCEPT = ".csv,.xlsx,.xls";
const PROMOTION_QR_ZIP_ACCEPT = ".zip";

function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getPromotionState(promotion) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = promotion.startDate ? new Date(`${promotion.startDate}T00:00:00`) : null;
  const endDate = promotion.endDate ? new Date(`${promotion.endDate}T00:00:00`) : null;

  if (!promotion.isActive) {
    if (promotion.status === "draft") {
      return { label: "Draft", className: "is-draft" };
    }

    if (promotion.status === "expired") {
      return { label: "Expired", className: "is-expired" };
    }

    return { label: "Inactive", className: "is-inactive" };
  }

  if (startDate && today < startDate) {
    return { label: "Scheduled", className: "is-scheduled" };
  }

  if (endDate && today > endDate) {
    return { label: "Expired", className: "is-expired" };
  }

  return { label: "Active", className: "is-active" };
}

function getPromotionCode(promotion) {
  return promotion?.promotionCode || String(promotion?.id || "");
}

function getFileExtension(fileName) {
  return String(fileName || "").split(".").pop()?.toLowerCase() || "";
}

function getFileBaseName(fileName) {
  const normalizedFileName = String(fileName || "");
  const extension = getFileExtension(normalizedFileName);

  return extension
    ? normalizedFileName.slice(0, -(extension.length + 1))
    : normalizedFileName;
}

function validatePromotionUploadFileName(file) {
  if (!file) {
    return "Choose the Promotion Management file.";
  }

  if (getFileBaseName(file.name) !== PROMOTION_UPLOAD_FILE_BASENAME) {
    return `The file name must be ${PROMOTION_UPLOAD_FILE_BASENAME}.`;
  }

  return "";
}

function validatePromotionQrZipFile(file) {
  if (!file) {
    return "Choose the QR images zip file.";
  }

  if (getFileExtension(file.name) !== "zip") {
    return "Upload the QR images as a .zip file.";
  }

  return "";
}

function hasSamePromotionId(firstId, secondId) {
  return String(firstId) === String(secondId);
}

function getPromotionSortTime(promotion) {
  const timestamp = promotion.updatedAt || promotion.createdAt || "";
  const parsedTime = new Date(timestamp.replace(" ", "T")).getTime();

  return Number.isNaN(parsedTime) ? 0 : parsedTime;
}

function sortPromotions(promotions) {
  return [...promotions].sort((firstPromotion, secondPromotion) => {
    if (firstPromotion.isActive !== secondPromotion.isActive) {
      return firstPromotion.isActive ? -1 : 1;
    }

    return getPromotionSortTime(secondPromotion) - getPromotionSortTime(firstPromotion);
  });
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="grey" strokeWidth="2">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function PromotionFormModal({
  form,
  formError,
  isOpen,
  mode,
  onClose,
  onSubmit,
  setForm,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentClassName="modal-content promotion-modal"
    >
      <div className="modal-header promoter-edit-header">
        <div>
          <p className="modal-eyebrow">Promotion</p>
          <h2>{mode === "create" ? "Create Promotion" : "Edit Promotion"}</h2>
        </div>
        <button
          type="button"
          className="close-modal"
          aria-label="Close promotion modal"
          onClick={onClose}
        >
          &times;
        </button>
      </div>

      <form className="promotion-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="promotionName">Promotion Name</label>
          <input
            id="promotionName"
            type="text"
            value={form.name}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                name: event.target.value,
              }))
            }
            placeholder="Summer Activation"
          />
        </div>

        <div className="form-group">
          <label htmlFor="promotionDescription">Description</label>
          <textarea
            id="promotionDescription"
            value={form.description}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                description: event.target.value,
              }))
            }
            placeholder="What this promotion covers"
            rows={3}
          />
        </div>

        <div className="promotion-date-grid">
          <div className="form-group">
            <label htmlFor="promotionStartDate">Start Date</label>
            <input
              id="promotionStartDate"
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  startDate: event.target.value,
                }))
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="promotionEndDate">End Date</label>
            <input
              id="promotionEndDate"
              type="date"
              value={form.endDate}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  endDate: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="promotion-date-grid">
          <div className="form-group">
            <label htmlFor="promotionStatus">Status</label>
            <select
              id="promotionStatus"
              value={form.status}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  status: event.target.value,
                }))
              }
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="promotionImage">Promotion Image</label>
            <input
              id="promotionImage"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  promotionImage: event.target.files?.[0] || null,
                }))
              }
            />
          </div>
        </div>

        {formError ? (
          <p className="form-error-text" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="brand-admin-form-actions">
          <button type="button" className="brand-admin-secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="brand-admin-primary-btn">
            {mode === "create" ? "Create Promotion" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PromotionsListView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [form, setForm] = useState(EMPTY_PROMOTION_FORM);
  const [formError, setFormError] = useState("");
  const {
    data: promotions = [],
    isLoading,
    isError,
    error,
  } = usePromotions();
  const { mutateAsync: createPromotion } = useCreatePromotion();
  const { mutateAsync: updatePromotion } = useUpdatePromotion();
  const { mutateAsync: deletePromotionRequest } = useDeletePromotion();

  const sortedPromotions = useMemo(() => sortPromotions(promotions), [promotions]);
  const activePromotion = useMemo(
    () => promotions.find((promotion) => promotion.isActive),
    [promotions],
  );

  const filteredPromotions = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return sortedPromotions;
    }

    return sortedPromotions.filter((promotion) =>
      [promotion.name, getPromotionState(promotion).label]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm),
    );
  }, [searchTerm, sortedPromotions]);

  const openCreateModal = () => {
    setEditingPromotion({ mode: "create" });
    setForm(EMPTY_PROMOTION_FORM);
    setFormError("");
  };

  const openEditModal = (promotion) => {
    setEditingPromotion(promotion);
    setForm({
      name: promotion.name,
      description: promotion.description || "",
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      status: promotion.isActive ? "active" : promotion.status || "draft",
      promotionImage: null,
    });
    setFormError("");
  };

  const closeModal = () => {
    setEditingPromotion(null);
    setForm(EMPTY_PROMOTION_FORM);
    setFormError("");
  };

  const savePromotion = async (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setFormError("Promotion name is required.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setFormError("Start date and end date are required.");
      return;
    }

    if (form.startDate > form.endDate) {
      setFormError("End date must be after the start date.");
      return;
    }

    const isCreating = editingPromotion?.mode === "create";
    const isActive = form.status === "active";
    const isActivatingDifferentPromotion =
      isActive &&
      activePromotion &&
      (isCreating || !hasSamePromotionId(activePromotion.id, editingPromotion.id));

    if (isActivatingDifferentPromotion) {
      setFormError(
        `${activePromotion.name} is currently active. Make it inactive before activating another promotion.`,
      );
      return;
    }

    try {
      if (isCreating) {
        await createPromotion({
          name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
          isActive,
          promotionImage: form.promotionImage,
        });
      } else {
        await updatePromotion({
          id: editingPromotion.id,
          name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
          isActive,
          promotionImage: form.promotionImage,
        });
      }

      await Swal.fire({
        icon: "success",
        title: isCreating ? "Promotion Created" : "Promotion Updated",
        text: `${name} has been saved.`,
        confirmButtonColor: "#22c55e",
      });

      closeModal();
    } catch (submitError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Save Promotion",
        text: submitError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const deletePromotion = async (promotion) => {
    console.log("Attempting to delete promotion:", promotion);
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Promotion?",
      text: `This will remove ${promotion.name}.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deletePromotionRequest({ id: promotion.id });
      console.log("Promotion deleted successfully:", promotion);
    } catch (deleteError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Delete Promotion",
        text: deleteError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <AppLayout activeNav="promotions">
      <div className="main-card promotions-card">
        <div className="card-header promotions-header">
          <div>
            <p className="brands-admin-eyebrow">Promotion Control</p>
            <h2>Promotions</h2>
            <p>
              Define promotion windows first, then manage the promoter-brand QR
              rows inside each promotion.
            </p>
          </div>
          <button type="button" className="brand-admin-primary-btn" onClick={openCreateModal}>
            Create Promotion
          </button>
        </div>

        <div className="brands-admin-toolbar">
          <div className="search-bar">
            <SearchIcon />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search promotions"
            />
          </div>
          <span className="brands-admin-count">
            {filteredPromotions.length} of {promotions.length} promotions
          </span>
        </div>

        {isError ? (
          <div className="brands-admin-state" role="alert">
            {error?.message || "Unable to load promotions right now."}
          </div>
        ) : (
        <div className="table-outer-border">
          <table className="data-table promotions-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Promotion</th>
                <th>Duration</th>
                <th>Status</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="brands-admin-empty">
                    Loading promotions...
                  </td>
                </tr>
              ) : filteredPromotions.length ? (
                filteredPromotions.map((promotion) => {
                  const promotionState = getPromotionState(promotion);

                  return (
                    <tr key={promotion.id}>
                      <td>
                        <span className="promotion-code-pill">
                          {getPromotionCode(promotion)}
                        </span>
                      </td>
                      <td>
                        <div className="promotion-name-cell">
                          <strong>{promotion.name}</strong>
                          <span>Updated {formatDate(promotion.updatedAt?.slice(0, 10))}</span>
                        </div>
                      </td>
                      <td>
                        {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                      </td>
                      <td>
                        <span className={`promotion-status ${promotionState.className}`}>
                          {promotionState.label}
                        </span>
                      </td>
                      <td className="actions-column">
                        <div className="brand-admin-actions">
                          <Link to={`/promotions/${promotion.id}`}>Manage</Link>
                          <button type="button" onClick={() => openEditModal(promotion)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => deletePromotion(promotion)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="brands-admin-empty">
                    No promotions created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <PromotionFormModal
        form={form}
        formError={formError}
        isOpen={Boolean(editingPromotion)}
        mode={editingPromotion?.mode === "create" ? "create" : "edit"}
        onClose={closeModal}
        onSubmit={savePromotion}
        setForm={setForm}
      />
    </AppLayout>
  );
}

function PromotionManagementView({ promotions }) {
  const { promotionId } = useParams();
  const promotion = promotions.find((currentPromotion) => currentPromotion.id === promotionId);
  const qrZipInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [qrZipFile, setQrZipFile] = useState(null);
  const [qrZipValidation, setQrZipValidation] = useState({
    error: "",
    payload: null,
    status: "idle",
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadValidation, setUploadValidation] = useState({
    error: "",
    payload: null,
    status: "idle",
  });
  const [qrUploadResponse, setQrUploadResponse] = useState(null);
  const [assignmentUploadResponse, setAssignmentUploadResponse] = useState(null);
  const { mutateAsync: uploadQrCodesBulk, isPending: isUploadingQrCodes } =
    useUploadPromotionQrCodesBulk();
  const {
    mutateAsync: importBrandsCategory,
    isPending: isUploadingAssignments,
  } = useImportBrandsCategory();
  const promoId = getPromotionCode(promotion);

  if (!promotion) {
    return (
      <AppLayout activeNav="promotions">
        <div className="main-card promotions-card">
          <div className="brands-admin-state">
            <strong>Promotion not found.</strong>
            <Link to="/promotions" className="brand-admin-secondary-link">
              Back to Promotions
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const promotionState = getPromotionState(promotion);
  const isQrZipValid = qrZipValidation.status === "valid";
  const isUploadValid = uploadValidation.status === "valid";

  const handleQrZipFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    const validationError = validatePromotionQrZipFile(selectedFile);

    setQrZipFile(selectedFile);
    setQrUploadResponse(null);
    setQrZipValidation({
      error: validationError,
      payload:
        selectedFile && !validationError
          ? {
              promoId,
              file: selectedFile,
            }
          : null,
      status: selectedFile && !validationError ? "valid" : "invalid",
    });
  };

  const clearQrZipFile = () => {
    setQrZipFile(null);
    setQrZipValidation({
      error: "",
      payload: null,
      status: "idle",
    });
    setQrUploadResponse(null);

    if (qrZipInputRef.current) {
      qrZipInputRef.current.value = "";
    }
  };

  const handleUploadFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    const validationError = validatePromotionUploadFileName(selectedFile);

    setUploadFile(selectedFile);
    setAssignmentUploadResponse(null);
    setUploadValidation({
      error: validationError,
      payload:
        selectedFile && !validationError
          ? {
              promoId,
              file: selectedFile,
            }
          : null,
      status: selectedFile && !validationError ? "valid" : "invalid",
    });
  };

  const clearUploadFile = () => {
    setUploadFile(null);
    setUploadValidation({
      error: "",
      payload: null,
      status: "idle",
    });
    setAssignmentUploadResponse(null);

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handlePreparedUpload = async (event) => {
    event.preventDefault();

    if (!isQrZipValid) {
      setQrZipValidation((currentValidation) => ({
        ...currentValidation,
        error: currentValidation.error || "Choose the QR images zip file first.",
        status: "invalid",
      }));
      return;
    }

    try {
      const response = await uploadQrCodesBulk({
        file: qrZipValidation.payload.file,
      });

      setQrUploadResponse(response);

      await Swal.fire({
        icon: "success",
        title: "QR Codes Uploaded",
        text: response.message || `QR zip uploaded for promotion ${promoId}.`,
        confirmButtonColor: "#22c55e",
      });
    } catch (uploadError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Upload QR Codes",
        text: uploadError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleAssignmentUpload = async () => {
    if (!isUploadValid) {
      setUploadValidation((currentValidation) => ({
        ...currentValidation,
        error: currentValidation.error || "Choose a file named Promotion Management first.",
        status: "invalid",
      }));
      return;
    }

    try {
      const response = await importBrandsCategory({
        file: uploadValidation.payload.file,
        promoId,
      });

      setAssignmentUploadResponse(response);

      await Swal.fire({
        icon: response.summary?.failed > 0 ? "warning" : "success",
        title: "Workbook Import Complete",
        text: response.message || `Workbook uploaded for promotion ${promoId}.`,
        confirmButtonColor: response.summary?.failed > 0 ? "#f59e0b" : "#22c55e",
      });
    } catch (uploadError) {
      await Swal.fire({
        icon: "error",
        title: "Unable to Upload Workbook",
        text: uploadError?.message || "Something went wrong.",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <AppLayout activeNav="promotions">
      <div className="main-card promotions-card promotion-management-card">
        <div className="promotion-management-header">
          <div>
            <Link to="/promotions" className="promotion-back-link">
              Back to Promotions
            </Link>
            <p className="brands-admin-eyebrow">Promotion Management</p>
            <h2>{promotion.name}</h2>
            <p>
              {getPromotionCode(promotion)} | {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
            </p>
          </div>
          <span className={`promotion-status ${promotionState.className}`}>
            {promotionState.label}
          </span>
        </div>

        <section className="promotion-assignment-panel">
          <div className="promotion-assignment-panel-header">
            <div>
              <h3>Promotion Assignments</h3>
              <p>
                Upload QR image zips or promotion management workbooks for this
                promotion. The promotion code is added to workbook uploads
                automatically.
              </p>
            </div>
            <span className="promotion-code-pill">promoId {promoId}</span>
          </div>

          <form className="promotion-upload-form" onSubmit={handlePreparedUpload}>
            <div className="promotion-upload-warning">
              <strong>QR image naming</strong>
              <span>
                Put every QR image in one zip file. Each image must be named
                exactly like its QR code, so code 12345 should use 12345.png,
                12345.jpg, or the matching image extension.
              </span>
            </div>

            <label className="promotion-upload-dropzone" htmlFor="promotionQrZipUpload">
              <input
                id="promotionQrZipUpload"
                ref={qrZipInputRef}
                type="file"
                accept={PROMOTION_QR_ZIP_ACCEPT}
                onChange={handleQrZipFileChange}
              />
              <span>{qrZipFile ? qrZipFile.name : "Choose QR images zip file"}</span>
              <small>ZIP only. Backend validates the images and filenames.</small>
            </label>

            {qrZipValidation.error ? (
              <p className="promotion-upload-message promotion-upload-message--error" role="alert">
                {qrZipValidation.error}
              </p>
            ) : null}

            {isQrZipValid ? (
              <div className="promotion-upload-ready">
                <strong>QR zip is ready</strong>
                <span>{qrZipValidation.payload.file.name}</span>
                <code>{`promoId=${qrZipValidation.payload.promoId}`}</code>
              </div>
            ) : null}

            {qrUploadResponse ? (
              <p className="promotion-upload-message promotion-upload-message--success">
                {qrUploadResponse.message || "QR codes uploaded successfully."}
              </p>
            ) : null}

            <div className="promotion-upload-rules">
              <div>
                <span>Accepted file name</span>
                <code>{PROMOTION_UPLOAD_FILE_BASENAME}.csv / .xls / .xlsx</code>
              </div>
            </div>

            <label className="promotion-upload-dropzone" htmlFor="promotionManagementUpload">
              <input
                id="promotionManagementUpload"
                ref={uploadInputRef}
                type="file"
                accept={PROMOTION_UPLOAD_ACCEPT}
                onChange={handleUploadFileChange}
              />
              <span>{uploadFile ? uploadFile.name : "Choose Promotion Management file"}</span>
              <small>CSV, XLS, or XLSX. Backend validates the workbook contents.</small>
            </label>

            {uploadValidation.error ? (
              <p className="promotion-upload-message promotion-upload-message--error" role="alert">
                {uploadValidation.error}
              </p>
            ) : null}

            {isUploadValid ? (
              <div className="promotion-upload-ready">
                <strong>File is ready</strong>
                <span>{uploadValidation.payload.file.name}</span>
                <code>{`promoId=${uploadValidation.payload.promoId}`}</code>
              </div>
            ) : null}

            {assignmentUploadResponse ? (
              <div className="promotion-upload-ready">
                <strong>Workbook import complete</strong>
                <span>{assignmentUploadResponse.message}</span>
                <code>
                  {`total=${assignmentUploadResponse.summary?.total ?? 0}, imported=${assignmentUploadResponse.summary?.imported ?? 0}, updated=${assignmentUploadResponse.summary?.updated ?? 0}, failed=${assignmentUploadResponse.summary?.failed ?? 0}`}
                </code>
              </div>
            ) : null}

            <div className="brand-admin-form-actions promotion-upload-actions">
              {qrZipFile ? (
                <button
                  type="button"
                  className="brand-admin-secondary-btn"
                  onClick={clearQrZipFile}
                >
                  Clear QR Zip
                </button>
              ) : null}
              {uploadFile ? (
                <button
                  type="button"
                  className="brand-admin-secondary-btn"
                  onClick={clearUploadFile}
                >
                  Clear
                </button>
              ) : null}
              <button
                type="submit"
                className="brand-admin-primary-btn"
                disabled={!isQrZipValid || isUploadingQrCodes}
              >
                {isUploadingQrCodes ? "Uploading QR Zip..." : "Upload QR Zip"}
              </button>
              <button
                type="button"
                className="brand-admin-primary-btn"
                disabled={!isUploadValid || isUploadingAssignments}
                onClick={handleAssignmentUpload}
              >
                {isUploadingAssignments ? "Uploading Workbook..." : "Upload Workbook"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppLayout>
  );
}

export default function PromotionsPage() {
  const { promotionId } = useParams();
  const { data: promotions = [] } = usePromotions();

  if (promotionId) {
    return (
      <PromotionManagementView
        promotions={promotions}
      />
    );
  }

  return <PromotionsListView />;
}
