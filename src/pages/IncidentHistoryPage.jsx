import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Pagination from "../components/Pagination";
import { useIncidents } from "../hooks/use-incidents";
import { formatLongDate, getIncidentStatusColor } from "../utils/formatters";

const PAGE_SIZE = 10;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="grey" strokeWidth="2">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

export default function IncidentHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const { data: incidents = [], isLoading, isError, error } = useIncidents();
  const navigate = useNavigate();

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredIncidents = incidents.filter((incident) =>
    [incident.promoterId, incident.issue, incident.category, incident.status, incident.date]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm),
  );

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const paginatedIncidents = filteredIncidents.slice(
    safeCurrentPage * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE + PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, incidents.length]);

  useEffect(() => {
    if (safeCurrentPage !== currentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);


  return (
    <AppLayout activeNav="incidents" mainContentClassName="promoters-main">
      <div className="main-card">
        <div className="card-header">
          <h2>Incident History</h2>
          <div className="search-section">
            <button
              className="secondary-action-btn"
              onClick={() => navigate("/report_incident")}
              style={{ padding: '8px 16px' }}
            >
              <PlusIcon />
              Report Incident
            </button>
            <div className="search-bar">
              <SearchIcon />
              <input
                type="text"
                value={searchTerm}
                placeholder="Search incidents..."
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </div>


        <div className="table-outer-border">
          <table id="incidentHistoryTable" className="data-table">
            <thead>
              <tr>
                <th>Promoter ID</th>
                <th>Issue</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">Loading incidents...</div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      {error?.message || "Unable to load incidents."}
                    </div>
                  </td>
                </tr>
              ) : paginatedIncidents.length ? (
                paginatedIncidents.map((incident) => {
                  const statusColor = getIncidentStatusColor(incident.status);

                  return (
                    <tr key={incident.id}>
                      <td>{incident.promoterId || "—"}</td>
                      <td>{incident.issue}</td>
                      <td>{formatLongDate(incident.date)}</td>
                      <td>
                        <span
                          className="status-pill"
                          style={{
                            color: statusColor,
                            backgroundColor: `${statusColor}20`,
                          }}
                        >
                          {incident.status}
                        </span>
                      </td>
                      <td className="actions-column">
                        <button
                          type="button"
                          className="view-button"
                          onClick={() => navigate(`/incidents/${incident.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">No incidents match your search.</div>
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
    </AppLayout>
  );
}
