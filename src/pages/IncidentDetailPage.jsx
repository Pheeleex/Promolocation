import React from "react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import {
  getIncidentsQueryKey,
  useIncidents,
  useUpdateIncidentStatus,
} from "../hooks/use-incidents";
import { useAuthStore } from "../store/auth-store";
import { assetPath } from "../utils/assetPath";
import { formatLongDate, getIncidentStatusColor } from "../utils/formatters";

const INCIDENT_STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];

function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function PhotoPlaceholder() {
  return (
    <div className="photo-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
      <span>No photo available</span>
    </div>
  );
}

export default function IncidentDetailPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const { incidentId } = useParams();
  const { data: incidents = [], isLoading, isError, error } = useIncidents();
  const { mutateAsync: updateIncidentStatus, isPending: isUpdatingIncident } =
    useUpdateIncidentStatus();
  const authUserId = useAuthStore((state) => state.user?.user_id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const incident = incidents.find((item) => item.id === incidentId);
  const statusColor = getIncidentStatusColor(incident?.status);

  useEffect(() => {
    setHasImageError(false);
  }, [incident?.image]);

  useEffect(() => {
    if (!incident) {
      setSelectedStatus("");
      setAdminNote("");
      return;
    }

    setSelectedStatus(
      INCIDENT_STATUS_OPTIONS.includes(incident.status) ? incident.status : "",
    );
    setAdminNote(incident.adminNote || "");
  }, [incident]);

  useEffect(() => {
    if (!isLightboxOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  if (isLoading) {
    return (
      <AppLayout activeNav="incidents" mainContentClassName="detail-main">
        <div className="detail-wrapper">
          <button type="button" className="back-btn" onClick={() => navigate("/incidents")}>
            <BackArrow />
            Back to Incident History
          </button>
          <div className="incident-card">
            <h1 className="page-title">Incident Details</h1>
            <p className="detail-empty-copy">Loading incident details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout activeNav="incidents" mainContentClassName="detail-main">
        <div className="detail-wrapper">
          <button type="button" className="back-btn" onClick={() => navigate("/incidents")}>
            <BackArrow />
            Back to Incident History
          </button>
          <div className="incident-card">
            <h1 className="page-title">Incident Details</h1>
            <p className="detail-empty-copy">
              {error?.message || "We couldn't load this incident right now."}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!incident) {
    return (
      <AppLayout activeNav="incidents" mainContentClassName="detail-main">
        <div className="detail-wrapper">
          <button type="button" className="back-btn" onClick={() => navigate("/incidents")}>
            <BackArrow />
            Back to Incident History
          </button>
          <div className="incident-card">
            <h1 className="page-title">Incident Details</h1>
            <p className="detail-empty-copy">
              We couldn't find that incident anymore. It may have been removed or the
              link is no longer valid.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const imageSource = incident.image ? assetPath(incident.image) : null;
  const trimmedAdminNote = adminNote.trim();

  const handleStatusUpdate = async (event) => {
    event.preventDefault();

    if (!selectedStatus) {
      Swal.fire({
        icon: "error",
        title: "Select a Status",
        text: "Choose Pending, In Progress, or Resolved before saving.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Update Incident?",
      text: `This will change the incident status to ${selectedStatus}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0E2B63",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Yes, Save Update",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await updateIncidentStatus({
        admin_id: authUserId ? String(authUserId) : "",
        incident_id: incident.id,
        status: selectedStatus,
        admin_note: trimmedAdminNote,
      });

      queryClient.setQueryData(
        getIncidentsQueryKey(authUserId ? String(authUserId) : ""),
        (currentIncidents = []) =>
          currentIncidents.map((currentIncident) =>
            currentIncident.id === incident.id
              ? {
                  ...currentIncident,
                  status: selectedStatus,
                  adminNote: trimmedAdminNote || null,
                }
              : currentIncident,
          ),
      );

      await Swal.fire({
        title: "Incident Updated",
        text: "The incident status and comment have been saved.",
        icon: "success",
        confirmButtonColor: "#0E2B63",
      });

      navigate("/incidents", { replace: true });
    } catch (updateError) {
      await Swal.fire({
        title: "Unable to Update Incident",
        text: updateError?.message || "Something went wrong.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <AppLayout activeNav="incidents" mainContentClassName="detail-main">
      <div className="detail-wrapper">
        <button type="button" className="back-btn" onClick={() => navigate("/incidents")}>
          <BackArrow />
          Back to Incident History
        </button>

        <h1 className="page-title">Incident Details</h1>

        <div className="incident-card">
          <div className="incident-top">
            <div className="report-section">
              <h3 className="card-section-title">Incident Report:</h3>
              <div className="report-rows">
                <div className="report-row">
                  <span className="row-label">Promoter ID:</span>
                  <span className="row-value">{incident.promoterId || "—"}</span>
                </div>
                <div className="report-row">
                  <span className="row-label">Date &amp; Time:</span>
                  <span className="row-value">{formatLongDate(incident.date)}</span>
                </div>
                <div className="report-row">
                  <span className="row-label">Current Status:</span>
                  <span className="row-value status-value">
                    <span>{incident.status || "—"}</span>
                    <span
                      className="status-dot"
                      style={{ backgroundColor: statusColor }}
                    ></span>
                  </span>
                </div>
                <div className="report-row last-row">
                  <span className="row-label">Incident Issue:</span>
                  <span className="row-value">{incident.issue || "—"}</span>
                </div>
              </div>
            </div>

            <div className="photo-section">
              <h3 className="card-section-title">Photo:</h3>
              <div
                className="photo-frame"
                role={imageSource && !hasImageError ? "button" : undefined}
                tabIndex={imageSource && !hasImageError ? 0 : undefined}
                onClick={() => {
                  if (imageSource && !hasImageError) {
                    setIsLightboxOpen(true);
                  }
                }}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && imageSource && !hasImageError) {
                    event.preventDefault();
                    setIsLightboxOpen(true);
                  }
                }}
              >
                {imageSource && !hasImageError ? (
                  <img
                    src={imageSource}
                    alt={`Incident photo for ${incident.promoterId || incident.id}`}
                    onError={() => setHasImageError(true)}
                  />
                ) : (
                  <PhotoPlaceholder />
                )}
              </div>
            </div>
          </div>

          <hr className="section-divider" />

          <div className="description-section">
            <h3 className="card-section-title">Description:</h3>
            <div className="description-box">
              <p>{incident.description || "—"}</p>
            </div>
          </div>

          <hr className="section-divider" />

          <div className="description-section">
            <h3 className="card-section-title">Admin Action:</h3>
            <form className="incident-action-form" onSubmit={handleStatusUpdate}>
              <div className="incident-action-grid">
                <div className="incident-input-group">
                  <label htmlFor="incidentStatus">Update Status</label>
                  <select
                    id="incidentStatus"
                    value={selectedStatus}
                    disabled={isUpdatingIncident}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                  >
                    <option value="">Select status</option>
                    {INCIDENT_STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="incident-input-group incident-comment-group">
                  <label htmlFor="adminComment">Comment</label>
                  <textarea
                    id="adminComment"
                    rows="5"
                    placeholder="Add an admin comment..."
                    value={adminNote}
                    disabled={isUpdatingIncident}
                    onChange={(event) => setAdminNote(event.target.value)}
                  />
                </div>
              </div>

              <div className="resolve-footer">
                <button
                  type="submit"
                  className="resolve-btn"
                  disabled={isUpdatingIncident || !selectedStatus}
                >
                  {isUpdatingIncident ? "Saving..." : "Save Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isLightboxOpen && imageSource ? (
        <div
          className="lightbox-overlay active"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsLightboxOpen(false);
            }
          }}
        >
          <div className="lightbox-inner">
            <button
              type="button"
              className="lightbox-close"
              title="Close"
              onClick={() => setIsLightboxOpen(false)}
            >
              &#x2715;
            </button>
            <img src={imageSource} alt="Incident Photo" />
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}
