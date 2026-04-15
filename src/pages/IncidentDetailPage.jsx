import React from "react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../components/AppLayout";
import {
  getIncidentsQueryKey,
  useIncidents,
  useUpdateIncidentStatus,
} from "../hooks/use-incidents";
import {
  getIncidentAuditTrailQueryKey,
  useIncidentAuditTrail,
} from "../hooks/use-incident-audit-trail";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";
import { useAuthStore } from "../store/auth-store";
import { isSpecialAdminUser } from "../utils/authAccess";
import { assetPath } from "../utils/assetPath";
import { formatLongDate, getIncidentStatusColor } from "../utils/formatters";

const ADMIN_INCIDENT_ACTIONS = {
  Pending: ["In Progress", "On Hold", "Resolved"],
  "In Progress": ["In Progress", "On Hold", "Resolved"],
  "On Hold": ["In Progress", "On Hold", "Resolved"],
  "Not Resolved": ["In Progress", "On Hold", "Resolved"],
};

const SPECIAL_ADMIN_INCIDENT_ACTIONS = {
  Resolved: ["Not Resolved", "Closed"],
};

function getAvailableIncidentStatusOptions(currentStatus, isSpecialAdmin) {
  if (!currentStatus) {
    return [];
  }

  const statusOptions = isSpecialAdmin
    ? SPECIAL_ADMIN_INCIDENT_ACTIONS
    : ADMIN_INCIDENT_ACTIONS;

  return statusOptions[currentStatus] || [];
}

function getIncidentActionHelperCopy(currentStatus, isSpecialAdmin) {
  if (isSpecialAdmin) {
    switch (currentStatus) {
      case "Pending":
        return "This incident is pending admin review. You can act after the admin resolves it.";
      case "In Progress":
        return "An admin is currently working on this incident. You cannot update it right now.";
      case "On Hold":
        return "An admin has placed this incident on hold. You cannot update it right now.";
      case "Resolved":
        return "Review the admin resolution and either confirm it as closed or return it as not resolved.";
      case "Not Resolved":
        return "An admin must resolve this incident again before you can take another action.";
      case "Closed":
        return "This incident has been closed and no further action is available.";
      default:
        return "Review the current incident status before taking action.";
    }
  }

  switch (currentStatus) {
    case "Pending":
      return "This incident has just been submitted. Move it into progress, place it on hold, or resolve it.";
    case "In Progress":
      return "Continue working the incident, place it on hold, keep it in progress, or mark it resolved when the issue has been handled.";
    case "On Hold":
      return "This incident is currently on hold. Move it back into progress, keep it on hold, or resolve it when work resumes.";
    case "Resolved":
      return "A special admin must now review this resolution before the incident can be closed.";
    case "Not Resolved":
      return "The resolution was rejected. Move the incident back to In Progress, place it on hold, or resolve it again.";
    case "Closed":
      return "This incident has been closed and can no longer be updated.";
    default:
      return "Select the next status for this incident.";
  }
}

function formatStatusOptionsList(statusOptions) {
  if (!statusOptions.length) {
    return "";
  }

  if (statusOptions.length === 1) {
    return statusOptions[0];
  }

  if (statusOptions.length === 2) {
    return `${statusOptions[0]} or ${statusOptions[1]}`;
  }

  return `${statusOptions.slice(0, -1).join(", ")}, or ${statusOptions[statusOptions.length - 1]}`;
}

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
  const adminCommentTextareaRef = useRef(null);
  const { incidentId } = useParams();
  const { data: incidents = [], isLoading, isError, error } = useIncidents();
  const { mutateAsync: updateIncidentStatus, isPending: isUpdatingIncident } =
    useUpdateIncidentStatus();
  const authUser = useAuthStore((state) => state.user);
  const authUserId = authUser?.user_id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const incident = incidents.find((item) => item.id === incidentId);
  const { data: auditTrail = [] } = useIncidentAuditTrail(incident);
  const statusColor = getIncidentStatusColor(incident?.status);
  const isSpecialAdmin = isSpecialAdminUser(authUser);
  const availableStatusOptions = getAvailableIncidentStatusOptions(
    incident?.status,
    isSpecialAdmin,
  );
  const canUpdateIncident = availableStatusOptions.length > 0;
  const isCommentRequired = selectedStatus === "Not Resolved";
  const incidentActionHelperCopy = getIncidentActionHelperCopy(
    incident?.status,
    isSpecialAdmin,
  );
  const incidentActionTitle = isSpecialAdmin ? "Incident Review" : "Incident Action";

  useAutoResizeTextarea(adminCommentTextareaRef, adminNote);

  useEffect(() => {
    setHasImageError(false);
  }, [incident?.image]);

  useEffect(() => {
    if (!incident) {
      setSelectedStatus("");
      setAdminNote("");
      return;
    }

    setSelectedStatus("");
    setAdminNote(canUpdateIncident ? "" : incident.adminNote || "");
  }, [incident, canUpdateIncident]);

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

    if (!canUpdateIncident) {
      await Swal.fire({
        icon: "info",
        title: "No Action Available",
        text: incidentActionHelperCopy,
        confirmButtonColor: "#0E2B63",
      });
      return;
    }

    if (!selectedStatus) {
      Swal.fire({
        icon: "error",
        title: "Select a Status",
        text: `Choose ${formatStatusOptionsList(availableStatusOptions)} before saving.`,
        confirmButtonColor: "#d33",
      });
      return;
    }

    if (isSpecialAdmin && selectedStatus === "Not Resolved" && !trimmedAdminNote) {
      Swal.fire({
        icon: "error",
        title: "Comment Required",
        text: "Add a comment before marking this incident as not resolved.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    try {
      await updateIncidentStatus({
        incident_id: incident.id,
        status: selectedStatus,
        comment: trimmedAdminNote || undefined,
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
      queryClient.invalidateQueries({
        queryKey: getIncidentAuditTrailQueryKey(incident.id),
      });

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
            <h3 className="card-section-title">{incidentActionTitle}:</h3>
            <p style={{ marginBottom: "16px", color: "#64748b" }}>{incidentActionHelperCopy}</p>
            <form className="incident-action-form" onSubmit={handleStatusUpdate}>
              <div className="incident-action-grid">
                <div className="incident-input-group">
                  <label htmlFor="incidentStatus">
                    Update Status
                    {canUpdateIncident ? <span className="required-mark">*</span> : null}
                  </label>
                  <select
                    id="incidentStatus"
                    value={selectedStatus}
                    disabled={isUpdatingIncident || !canUpdateIncident}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                  >
                    <option value="" disabled>
                      {canUpdateIncident ? "Select status" : "No actions available"}
                    </option>
                    {availableStatusOptions.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="incident-input-group incident-comment-group">
                  <label htmlFor="adminComment">
                    Comment
                    {isCommentRequired ? <span className="required-mark">*</span> : null}
                  </label>
                  <textarea
                    id="adminComment"
                    ref={adminCommentTextareaRef}
                    rows="5"
                    placeholder={
                      canUpdateIncident
                        ? "Add a comment..."
                        : "No update is available for the current incident state."
                    }
                    value={adminNote}
                    disabled={isUpdatingIncident || !canUpdateIncident}
                    onChange={(event) => setAdminNote(event.target.value)}
                  />
                </div>
              </div>

              <div className="resolve-footer">
                <button
                  type="submit"
                  className="resolve-btn"
                  disabled={isUpdatingIncident || !canUpdateIncident || !selectedStatus}
                >
                  {isUpdatingIncident
                    ? "Saving..."
                    : canUpdateIncident
                      ? "Save Update"
                      : "No Action Available"}
                </button>
              </div>
            </form>
          </div>

          <hr className="section-divider" />

          <div className="description-section">
            <h3 className="card-section-title">Audit Trail:</h3>
            <p className="audit-trail-copy">
              Every incident action is recorded here so the full review history stays visible.
            </p>

            <div className="audit-trail-table-wrapper">
              <table className="audit-trail-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Action</th>
                    <th>Comment</th>
                    <th>Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditTrail.length ? (
                    auditTrail.map((auditEntry) => (
                      <tr key={auditEntry.id}>
                        <td>{auditEntry.userId}</td>
                        <td>{auditEntry.action}</td>
                        <td>{auditEntry.comment || "--"}</td>
                        <td>{formatLongDate(auditEntry.dateTime)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">
                        <div className="audit-trail-empty-state">
                          No audit entries have been recorded for this incident yet.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
