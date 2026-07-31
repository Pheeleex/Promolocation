import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Pagination from "../components/Pagination";
import { useIncidents } from "../hooks/use-incidents";
import { useTablePagination } from "../hooks/use-table-pagination";
import { formatLongDate, getIncidentStatusColor } from "../utils/formatters";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="grey" strokeWidth="2">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

export default function IncidentHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: incidents = [], isLoading, isError, error } = useIncidents();
  const navigate = useNavigate();

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredIncidents = incidents.filter((incident) =>
    [incident.issue, incident.category, incident.status, incident.date]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm),
  );

  const {
    currentPage,
    paginatedItems: paginatedIncidents,
    setCurrentPage,
    totalPages,
  } = useTablePagination(filteredIncidents, [searchTerm, incidents.length]);

  return (
    <AppLayout activeNav="incidents" mainContentClassName="promoters-main">
      <div className="main-card">
        <div className="card-header">
          <h2>Incident History</h2>
          <div className="search-section">
            <div className="search-bar">
              <SearchIcon />
              <input
                type="text"
                value={searchTerm}
                placeholder="Search by issue or status..."
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </div>


        <div className="table-outer-border">
          <table id="incidentHistoryTable" className="data-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="3">
                    <div className="empty-state">Loading incidents...</div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="3">
                    <div className="empty-state">
                      {error?.message || "Unable to load incidents."}
                    </div>
                  </td>
                </tr>
              ) : paginatedIncidents.length ? (
                paginatedIncidents.map((incident) => {
                  const statusColor = getIncidentStatusColor(incident.status);

                  return (
                    <tr
                      key={incident.id}
                      className="clickable-row"
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/incidents/${incident.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/incidents/${incident.id}`);
                        }
                      }}
                    >
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="empty-state">No incidents match your search.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </AppLayout>
  );
}
