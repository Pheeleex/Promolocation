import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { createIncident } from "../api/incidents";
import { useAuthStore } from "../store/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { getIncidentsQueryKey } from "../hooks/use-incidents";
import Swal from "sweetalert2";

export default function ReportIncidentPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all required fields (Title and Description).",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (!user?.user_id || !user?.promoter_id) {
      Swal.fire({
        icon: "error",
        title: "Missing Identification",
        text: "Your account information is incomplete. Please contact support.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createIncident(
        user.user_id.toString(),
        user.promoter_id,
        title,
        description,
        image
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: getIncidentsQueryKey(String(user.user_id)),
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Incident reported successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      // Navigate to history after success
      setTimeout(() => navigate("/incidents"), 1500);
    } catch (error) {
      console.error("Failed to submit incident:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error?.message || "Something went wrong while reporting the incident.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout activeNav="report_incident" mainContentClassName="detail-main">
      <div className="report-page-wrapper">
        <div className="report-header">
          <h1>Report Incident</h1>
          <p>Submit a record and description of the observed issue.</p>
        </div>

        <div className="report-card-container">
          <form onSubmit={handleSubmit} className="report-form-premium">
            <div className="report-form-grid">
              <div className="report-form-left">
                <div className="input-field-group">
                  <label htmlFor="incident-title">
                    Incident Title <span className="required-mark">*</span>
                  </label>
                  <input
                    id="incident-title"
                    type="text"
                    placeholder="Use a descriptive title that summarizes the issue."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                    className="premium-input-field"
                  />
                </div>

                <div className="input-field-group">
                  <label htmlFor="incident-desc">
                    Detailed Description <span className="required-mark">*</span>
                  </label>
                  <textarea
                    id="incident-desc"
                    placeholder="Provide as much context as possible. Include device type, location, and specific observations..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    className="premium-textarea-field"
                  ></textarea>
                </div>
              </div>

              <div className="report-form-right">
                <div className="input-field-group">
                  <label>Photographic Proof</label>
                  <div
                    className={`premium-upload-zone ${preview ? "has-image" : ""}`}
                    onClick={() => !isSubmitting && fileInputRef.current.click()}
                  >
                    {preview ? (
                      <>
                        <img src={preview} alt="Evidence preview" className="evidence-preview-img" />
                        <div className="upload-overlay">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <span>Change Photo</span>
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
                        <p className="upload-prompt">Tap to upload proof</p>
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

              <button
                type="submit"
                className="submit-report-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : "Send Report"}
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
          padding: 40px;
        }

        .report-form-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 40px;
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

        .required-mark {
          color: #e05260;
          margin-left: 2px;
        }

        .field-hint {
          font-size: 12px;
          color: #94a3b8;
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
          resize: vertical;
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
          .submit-report-btn, .secondary-action-btn {
            width: 100%;
          }
        }
      `}</style>
    </AppLayout>
  );
}
