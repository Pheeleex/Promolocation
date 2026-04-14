import React, { useState, useRef } from "react";
import { createIncident } from "../api/incidents";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";
import { useAuthStore } from "../store/auth-store";
import { validateImageUpload } from "../utils/imageUploadValidation";
import Swal from "sweetalert2";

export default function CreateIncidentForm({ onCancel, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const descriptionTextareaRef = useRef(null);
  const { user } = useAuthStore();

  useAutoResizeTextarea(descriptionTextareaRef, description);

  const resetSelectedImage = () => {
    setImage(null);
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateImageUpload(file);

    if (validationError) {
      resetSelectedImage();
      Swal.fire({
        icon: "error",
        title: "Invalid Image",
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !image) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all fields (Title, Description, and Image).",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (!user?.user_id || !user?.promoter_id) {
      Swal.fire({
        icon: "error",
        title: "Missing Identification",
        text: "Your account information is incomplete (missing User ID or Promoter ID). Please contact support.",
      });
      return;
    }

    const imageValidationError = validateImageUpload(image);

    if (imageValidationError) {
      resetSelectedImage();
      Swal.fire({
        icon: "error",
        title: "Invalid Image",
        text: imageValidationError,
        confirmButtonColor: "#d33",
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
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Incident reported successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess?.();
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
    <div className="create-incident-form">
      <h3>Report New Incident</h3>
      <p className="form-subtitle">Provide details about the issue noticed.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="incident-title">
            Issue Title <span className="required-mark">*</span>
          </label>
          <input
            id="incident-title"
            type="text"
            placeholder="e.g., Late Arrival, Uniform Violation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="incident-desc">
            Description <span className="required-mark">*</span>
          </label>
          <textarea
            id="incident-desc"
            ref={descriptionTextareaRef}
            placeholder="Provide a detailed description of the incident..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div className="form-group">
          <label>
            Proof / Image <span className="required-mark">*</span>
          </label>
          <div 
            className={`image-upload-area ${preview ? "has-preview" : ""}`}
            onClick={() => !isSubmitting && fileInputRef.current.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="upload-preview" />
            ) : (
              <div className="upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Click to upload image</span>
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

        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Report Incident"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .create-incident-form h3 {
          margin-bottom: 8px;
          font-size: 1.5rem;
          color: #1a1a1a;
        }
        .form-subtitle {
          margin-bottom: 24px;
          color: #666;
          font-size: 0.9rem;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus {
          border-color: #3085d6;
          outline: none;
        }
        .form-group textarea {
          min-height: 100px;
          overflow: hidden;
          resize: none;
        }
        .image-upload-area {
          border: 2px dashed #ccc;
          border-radius: 12px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          overflow: hidden;
          position: relative;
        }
        .image-upload-area:hover {
          border-color: #3085d6;
          background: #f8fbff;
        }
        .image-upload-area.has-preview {
          border-style: solid;
        }
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #888;
        }
        .upload-placeholder svg {
          width: 32px;
          height: 32px;
          margin-bottom: 8px;
        }
        .upload-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
        }
        .cancel-btn, .submit-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cancel-btn {
          background: transparent;
          border: 1px solid #ddd;
          color: #666;
        }
        .cancel-btn:hover {
          background: #f5f5f5;
        }
        .submit-btn {
          background: #3085d6;
          border: none;
          color: white;
          box-shadow: 0 4px 6px rgba(48, 133, 214, 0.2);
        }
        .submit-btn:hover:not(:disabled) {
          background: #2b78c2;
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(48, 133, 214, 0.3);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
