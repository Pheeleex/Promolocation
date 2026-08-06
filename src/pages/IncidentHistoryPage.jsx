import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";
import SearchBar from "../components/SearchBar";
import { useIncidents } from "../hooks/use-incidents";
import { formatLongDate, getIncidentStatusColor } from "../utils/formatters";

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

  return (
    <AppLayout activeNav="incidents" mainContentClassName="promoters-main">
      <div className="main-card">
        <div className="card-header">
          <h2>Incident History</h2>
          <div className="search-section">
            <SearchBar
              ariaLabel="Search incidents"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by issue or status..."
            />
          </div>
        </div>


        <DataTable
          columns={[
            {
              header: "Issue",
              key: "issue",
              render: (incident) => incident.issue,
            },
            {
              header: "Date & Time",
              key: "date",
              render: (incident) => formatLongDate(incident.date),
            },
            {
              header: "Status",
              key: "status",
              render: (incident) => {
                const statusColor = getIncidentStatusColor(incident.status);

                return (
                  <span
                    className="status-pill"
                    style={{
                      color: statusColor,
                      backgroundColor: `${statusColor}20`,
                    }}
                  >
                    {incident.status}
                  </span>
                );
              },
            },
          ]}
          dependencies={[searchTerm, incidents.length]}
          emptyMessage="No incidents match your search."
          error={error}
          errorMessage="Unable to load incidents."
          getRowKey={(incident) => incident.id}
          isError={isError}
          isLoading={isLoading}
          items={filteredIncidents}
          loadingMessage="Loading incidents..."
          rowProps={(incident) => ({
            className: "clickable-row",
            role: "link",
            tabIndex: 0,
            onClick: () => navigate(`/incidents/${incident.id}`),
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(`/incidents/${incident.id}`);
              }
            },
          })}
          tableId="incidentHistoryTable"
        />
      </div>
    </AppLayout>
  );
}
