import React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";
import SearchBar from "../components/SearchBar";
import {
  HELP_DESK_REQUEST_TYPES,
  mockHelpDeskRequests,
} from "../data/helpDeskMock";
import { useAuthStore } from "../store/auth-store";
import { isSpecialAdminUser } from "../utils/authAccess";
import { formatLongDate, getIncidentStatusColor } from "../utils/formatters";

const STATUS_FILTERS = [
  "all",
  "Submitted",
  "In Progress",
  "Resolved",
  "Not Resolved",
  "Closed",
];

function getRelativeSubmittedTime(value) {
  const submittedDate = new Date(value);

  if (Number.isNaN(submittedDate.getTime())) {
    return "—";
  }

  const elapsedMs = Date.now() - submittedDate.getTime();
  const elapsedHours = Math.max(1, Math.round(elapsedMs / (1000 * 60 * 60)));

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.round(elapsedHours / 24);

  return `${elapsedDays}d ago`;
}

export default function IncidentHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [requestType, setRequestType] = useState("all");
  const [status, setStatus] = useState("all");
  const authUser = useAuthStore((state) => state.user);
  const canCreateRequest = isSpecialAdminUser(authUser);
  const navigate = useNavigate();

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredRequests = useMemo(
    () =>
      mockHelpDeskRequests.filter((request) => {
        const matchesSearch = [
          request.id,
          request.issue,
          request.category,
          request.status,
          request.requestTypeLabel,
          request.agencyName,
          request.requesterName,
          request.priority,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchTerm);
        const matchesType =
          requestType === "all" || request.requestType === requestType;
        const matchesStatus = status === "all" || request.status === status;

        return matchesSearch && matchesType && matchesStatus;
      }),
    [normalizedSearchTerm, requestType, status],
  );
  const requestSummary = useMemo(
    () =>
      mockHelpDeskRequests.reduce(
        (summary, request) => ({
          ...summary,
          [request.status]: (summary[request.status] || 0) + 1,
        }),
        {},
      ),
    [],
  );
  const actionRequiredCount = canCreateRequest
    ? requestSummary.Resolved || 0
    : (requestSummary.Submitted || 0) + (requestSummary["Not Resolved"] || 0);
  const actionRequiredCopy = canCreateRequest
    ? "resolved requests awaiting requester review"
    : "requests awaiting team action";
  const hasActiveFilters = requestType !== "all" || status !== "all" || Boolean(searchTerm);
  const clearFilters = () => {
    setSearchTerm("");
    setRequestType("all");
    setStatus("all");
  };

  return (
    <AppLayout activeNav="incidents" mainContentClassName="promoters-main">
      <div className="main-card help-desk-card">
        <div className="card-header help-desk-header">
          <div>
            <p className="brands-admin-eyebrow">Help Desk</p>
            <h2>Requests</h2>
            <p>Review incidents, setup needs, access changes, and follow-up decisions.</p>
          </div>
          <div className="help-desk-header-actions">
            <SearchBar
              ariaLabel="Search help desk requests"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search requests..."
            />
            {canCreateRequest ? (
              <button
                type="button"
                className="brand-admin-primary-btn"
                onClick={() => navigate("/report_incident")}
              >
                New Request
              </button>
            ) : null}
          </div>
        </div>

        <div className="help-desk-summary-strip">
          {["Submitted", "In Progress", "Resolved", "Closed"].map((statusOption) => {
            const statusColor = getIncidentStatusColor(statusOption);

            return (
              <button
                type="button"
                key={statusOption}
                className={`help-desk-summary-item${status === statusOption ? " is-selected" : ""}`}
                onClick={() => setStatus(status === statusOption ? "all" : statusOption)}
              >
                <span className="help-desk-summary-dot" style={{ backgroundColor: statusColor }} />
                <span>{statusOption}</span>
                <strong>{requestSummary[statusOption] || 0}</strong>
              </button>
            );
          })}
        </div>

        {actionRequiredCount > 0 ? (
          <div className="help-desk-attention-bar">
            <strong>Action required</strong>
            <span>
              {actionRequiredCount} {actionRequiredCopy}
            </span>
          </div>
        ) : null}

        <div className="help-desk-toolbar">
          <div className="help-desk-filter-group" aria-label="Status filters">
            {STATUS_FILTERS.map((statusOption) => {
              const isAllFilter = statusOption === "all";
              const statusColor = getIncidentStatusColor(statusOption);

              return (
                <button
                  type="button"
                  key={statusOption}
                  className={`help-desk-filter-chip${status === statusOption ? " is-selected" : ""}`}
                  onClick={() => setStatus(statusOption)}
                  style={isAllFilter ? undefined : { "--chip-color": statusColor }}
                >
                  {isAllFilter ? "All" : statusOption}
                </button>
              );
            })}
          </div>

          <div className="help-desk-toolbar-controls">
            <label className="filter-field">
              <span>Request Type</span>
              <select value={requestType} onChange={(event) => setRequestType(event.target.value)}>
                <option value="all">All request types</option>
                {HELP_DESK_REQUEST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="brand-admin-secondary-btn"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Clear
            </button>
          </div>

          <span className="brands-admin-count">
            {filteredRequests.length} of {mockHelpDeskRequests.length} requests
          </span>
        </div>

        <DataTable
          columns={[
            {
              header: "Status",
              key: "status",
              headerClassName: "help-desk-status-col",
              cellClassName: "help-desk-status-col",
              render: (request) => (
                <span
                  className="status-pill help-desk-status-pill"
                  style={{
                    color: getIncidentStatusColor(request.status),
                    backgroundColor: `${getIncidentStatusColor(request.status)}20`,
                  }}
                >
                  <span
                    className="help-desk-status-dot"
                    style={{ backgroundColor: getIncidentStatusColor(request.status) }}
                  />
                  {request.status}
                </span>
              ),
            },
            {
              header: "Request",
              key: "request",
              headerClassName: "help-desk-request-col",
              cellClassName: "help-desk-request-col",
              render: (request) => (
                <div className="brand-admin-name-cell help-desk-request-cell">
                  <strong title={request.issue}>{request.issue}</strong>
                  <span title={`${request.id} · ${request.category}`}>
                    {request.id} · {request.category}
                  </span>
                </div>
              ),
            },
            {
              header: "Type",
              key: "type",
              headerClassName: "help-desk-type-col",
              cellClassName: "help-desk-type-col",
              render: (request) => request.requestTypeLabel,
            },
            {
              header: "Requester",
              key: "requester",
              headerClassName: "help-desk-requester-col",
              cellClassName: "help-desk-requester-col",
              render: (request) => (
                <div className="brand-admin-name-cell help-desk-requester-cell">
                  <strong title={request.requesterName}>{request.requesterName}</strong>
                  <span title={request.agencyName}>{request.agencyName}</span>
                </div>
              ),
            },
            {
              header: "Submitted",
              key: "date",
              headerClassName: "help-desk-date-col",
              cellClassName: "help-desk-date-col",
              render: (request) => (
                <span className="help-desk-relative-time" title={formatLongDate(request.date)}>
                  {getRelativeSubmittedTime(request.date)}
                </span>
              ),
            },
          ]}
          dependencies={[searchTerm, requestType, status, filteredRequests.length]}
          emptyMessage="No help desk requests match your filters."
          getRowKey={(request) => request.id}
          items={filteredRequests}
          rowProps={(request) => ({
            className: "clickable-row help-desk-row",
            style: { "--request-status-color": getIncidentStatusColor(request.status) },
            role: "link",
            tabIndex: 0,
            onClick: () => navigate(`/incidents/${request.id}`),
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(`/incidents/${request.id}`);
              }
            },
          })}
          tableId="incidentHistoryTable"
        />
      </div>
    </AppLayout>
  );
}
