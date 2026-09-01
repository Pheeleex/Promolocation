import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import { HELP_DESK_REQUEST_TYPES } from "../data/helpDeskMock";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";
import { validateImageUpload } from "../utils/imageUploadValidation";

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

function getMissingRequestFields({ requestType, title, description }) {
  const missingFields = [];

  if (!requestType) {
    missingFields.push("Request Type");
  }

  if (!title) {
    missingFields.push("Request Title");
  }

  if (!description) {
    missingFields.push("Request Details");
  }

  return missingFields;
}

export default function ReportIncidentPage() {
  const [requestType, setRequestType] = useState("incident_report");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agency, setAgency] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const descriptionTextareaRef = useRef(null);
  const navigate = useNavigate();
  const selectedRequestType = HELP_DESK_REQUEST_TYPES.find(
    (type) => type.value === requestType,
  );

  useAutoResizeTextarea(descriptionTextareaRef, description);

  const resetSelectedImage = () => {
    setImage(null);
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateImageUpload(file);

    if (validationError) {
      resetSelectedImage();
      Swal.fire({
        icon: "error",
        title: "Invalid Attachment",
        text: validationError,
        confirmButtonColor: "#d33",
      });
      return;
    }

    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const missingFieldLabels = getMissingRequestFields({
      requestType,
      title: trimmedTitle,
      description: trimmedDescription,
    });

    if (missingFieldLabels.length) {
      Swal.fire({
        icon: "warning",
        title: "Missing Request Details",
        text: `Please complete: ${missingFieldLabels.join(", ")}.`,
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (image) {
      const imageValidationError = validateImageUpload(image);

      if (imageValidationError) {
        resetSelectedImage();
        Swal.fire({
          icon: "error",
          title: "Invalid Attachment",
          text: imageValidationError,
          confirmButtonColor: "#d33",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 500);
      });

      await Swal.fire({
        icon: "success",
        title: "Request Submitted",
        text: "This prototype submitted the request locally so you can review the Help Desk flow.",
        confirmButtonColor: "#22c55e",
        confirmButtonText: "OK",
      });

      navigate("/incidents");
    } catch (error) {
      console.error("Failed to submit request:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error?.message || "Something went wrong while submitting the request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout activeNav="report_incident" mainContentClassName="detail-main">
      <div className="report-page-wrapper">
        <div className="report-header">
          <h1>New Help Desk Request</h1>
          <p>Submit incidents, access changes, setup needs, and operational support requests.</p>
        </div>

        <div className="report-card-container">
          <form onSubmit={handleSubmit} className="report-form-premium" noValidate>
            <div className="request-type-panel">
              {HELP_DESK_REQUEST_TYPES.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  className={`request-type-option${requestType === type.value ? " is-selected" : ""}`}
                  onClick={() => setRequestType(type.value)}
                  disabled={isSubmitting}
                >
                  <span>{type.label}</span>
                  <small>{type.description}</small>
                </button>
              ))}
            </div>

            <div className="report-form-grid">
              <div className="report-form-left">
                <div className="input-field-group">
                  <label htmlFor="request-title">
                    Request Title <span className="required-mark">*</span>
                  </label>
                  <input
                    id="request-title"
                    type="text"
                    placeholder={
                      selectedRequestType?.value === "setup_request"
                        ? "Example: Add new agency and promoter batch"
                        : "Use a descriptive title that summarizes the request."
                    }
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={isSubmitting}
                    className="premium-input-field"
                  />
                </div>

                <div className="input-field-group">
                  <label htmlFor="request-desc">
                    Request Details <span className="required-mark">*</span>
                  </label>
                  <textarea
                    id="request-desc"
                    ref={descriptionTextareaRef}
                    placeholder="Include the exact change needed, affected agency/promoters/brands/promotions, and any deadline or context..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={isSubmitting}
                    className="premium-textarea-field"
                  />
                </div>

                <div className="request-meta-grid">
                  <div className="input-field-group">
                    <label htmlFor="request-agency">Related Agency</label>
                    <input
                      id="request-agency"
                      type="text"
                      placeholder="Example: Zipline, Skyline, or All Agencies"
                      value={agency}
                      onChange={(event) => setAgency(event.target.value)}
                      disabled={isSubmitting}
                      className="premium-input-field"
                    />
                  </div>

                  <div className="input-field-group">
                    <label htmlFor="request-priority">Priority</label>
                    <select
                      id="request-priority"
                      value={priority}
                      onChange={(event) => setPriority(event.target.value)}
                      disabled={isSubmitting}
                      className="premium-input-field"
                    >
                      {PRIORITY_OPTIONS.map((priorityOption) => (
                        <option key={priorityOption} value={priorityOption}>
                          {priorityOption}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="report-form-right">
                <div className="input-field-group">
                  <label>Attachment</label>
                  <div
                    className={`premium-upload-zone ${preview ? "has-image" : ""}`}
                    onClick={() => !isSubmitting && fileInputRef.current.click()}
                  >
                    {preview ? (
                      <>
                        <img src={preview} alt="Request attachment preview" className="evidence-preview-img" />
                        <div className="upload-overlay">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <span>Change Attachment</span>
                        </div>
                      </>
                    ) : (
                      <div className="upload-empty-state">
                        <div className="upload-icon-circle">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <p className="upload-prompt">Tap to upload support file</p>
                        <p className="upload-subtext">JPG, PNG or WEBP (Max 5MB)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="report-form-footer">
              <button type="submit" className="submit-report-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .report-page-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .report-header h1 {
          font-size: 28px;
          font-weight: 800;
          color: var(--navy);
        }

        .report-header p {
          color: var(--text-gray);
          font-size: 16px;
        }

        .report-card-container {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(14, 43, 99, 0.08);
          border: 1px solid var(--border-blue);
          overflow: hidden;
        }

        .report-form-premium {
          padding: 32px;
        }

        .request-type-panel {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 28px;
        }

        .request-type-option {
          display: flex;
          min-height: 120px;
          flex-direction: column;
          gap: 8px;
          justify-content: flex-start;
          text-align: left;
          border: 1px solid var(--border-blue);
          border-radius: 8px;
          background: #ffffff;
          color: var(--navy);
          padding: 16px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }

        .request-type-option:hover:not(:disabled),
        .request-type-option.is-selected {
          border-color: #2563eb;
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.12);
          transform: translateY(-1px);
        }

        .request-type-option span {
          font-size: 15px;
          font-weight: 800;
        }

        .request-type-option small {
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .report-form-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 40px;
        }

        .request-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .input-field-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }

        .input-field-group label {
          font-weight: 700;
          font-size: 15px;
          color: var(--navy);
        }

        .premium-input-field {
          height: 48px;
          padding: 0 16px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
        }

        .premium-input-field:focus {
          border-color: var(--accent-blue);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(0, 168, 232, 0.1);
          outline: none;
        }

        .premium-textarea-field {
          min-height: 180px;
          padding: 16px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          line-height: 1.6;
          transition: all 0.2s;
          overflow: hidden;
          resize: none;
        }

        .premium-textarea-field:focus {
          border-color: var(--accent-blue);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(0, 168, 232, 0.1);
          outline: none;
        }

        .premium-upload-zone {
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          height: 284px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          overflow: hidden;
          position: relative;
          background: #f8fafc;
        }

        .premium-upload-zone:hover {
          border-color: var(--accent-blue);
          background: #f0f9ff;
        }

        .premium-upload-zone.has-image {
          border-style: solid;
          border-color: #e2e8f0;
        }

        .upload-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px;
        }

        .upload-icon-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          margin-bottom: 16px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }

        .upload-icon-circle svg {
          width: 24px;
          height: 24px;
        }

        .upload-prompt {
          font-weight: 700;
          font-size: 15px;
          color: var(--navy);
          margin: 0 0 4px;
        }

        .upload-subtext {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .evidence-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(14, 43, 99, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          opacity: 0;
          transition: opacity 0.2s;
          backdrop-filter: blur(4px);
          gap: 10px;
        }

        .premium-upload-zone:hover .upload-overlay {
          opacity: 1;
        }

        .upload-overlay svg {
          width: 32px;
          height: 32px;
        }

        .upload-overlay span {
          font-weight: 600;
          font-size: 14px;
        }

        .report-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 20px;
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px solid #f1f5f9;
        }

        .submit-report-btn {
          height: 48px;
          padding: 0 32px;
          background: var(--navy);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          transition: all 0.2s;
          box-shadow: 0 10px 20px rgba(14, 43, 99, 0.15);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .submit-report-btn:hover:not(:disabled) {
          background: #1a3f8f;
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(14, 43, 99, 0.2);
        }

        .submit-report-btn:active {
          transform: translateY(0);
        }

        .submit-report-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .request-type-panel,
          .request-meta-grid,
          .report-form-grid {
            grid-template-columns: 1fr;
          }

          .premium-upload-zone {
            height: 320px;
          }
        }

        @media (max-width: 600px) {
          .report-form-premium {
            padding: 24px;
          }

          .report-form-footer {
            flex-direction: column-reverse;
          }

          .submit-report-btn {
            width: 100%;
          }
        }
      `}</style>
    </AppLayout>
  );
}
