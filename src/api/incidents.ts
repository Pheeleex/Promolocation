import { mapIncident, mapIncidentAuditEntry } from "../../types/mapper";
import {
  CreateIncidentResponse,
  GetIncidentAuditTrailResponse,
  GetIncidentsResponse,
  Incident,
  IncidentAuditEntry,
  UpdateIncidentStatusPayload,
  UpdateIncidentStatusResponse,
} from "../../types/incidents";
import { apiClient } from "./client";
import { authenticatedAdminPost } from "./loggedIn-client";

const API_TOKEN = import.meta.env.VITE_API_TOKEN ?? "";
const GET_INCIDENTS_PATH = "/get_incidents";
const UPDATE_INCIDENT_STATUS_PATH = "/admin_api/update_incident";
const GET_INCIDENT_AUDIT_TRAIL_PATH = "/admin_api/get_incident_audit_trail";
const CREATE_INCIDENT_PATH = "/create_incident";

function normalizeIncidentIdentifier(incidentId: string) {
  return /^\d+$/.test(incidentId) ? Number(incidentId) : incidentId;
}

export async function getIncidents(userId: string): Promise<Incident[]> {
  if (!userId) {
    throw new Error("No user ID found. Please log in again.");
  }

  const response = await apiClient<GetIncidentsResponse>(GET_INCIDENTS_PATH, {
    method: "POST",
    body: JSON.stringify({
      token: API_TOKEN,
      user_id: userId,
    }),
  });

  if (response.status !== 200) {
    throw new Error("Failed to fetch incidents.");
  }

  return response.incidents.map(mapIncident);
}

export async function updateIncidentStatus(
  payload: UpdateIncidentStatusPayload
): Promise<UpdateIncidentStatusResponse> {
  const response = await authenticatedAdminPost<UpdateIncidentStatusResponse>(
    UPDATE_INCIDENT_STATUS_PATH,
    {
      ...payload,
      incident_id: normalizeIncidentIdentifier(payload.incident_id),
    },
  );

  if (response.status !== 200) {
    throw new Error(response.message || "Failed to update incident.");
  }

  return response;
}

export async function getIncidentAuditTrail(
  incidentId: string,
): Promise<IncidentAuditEntry[]> {
  const normalizedIncidentId = incidentId ? String(incidentId) : "";

  if (!normalizedIncidentId) {
    throw new Error("Incident ID is required.");
  }

  const response = await authenticatedAdminPost<GetIncidentAuditTrailResponse>(
    GET_INCIDENT_AUDIT_TRAIL_PATH,
    {
      incident_id: normalizeIncidentIdentifier(normalizedIncidentId),
    },
  );

  if (response.status !== 200) {
    throw new Error(response.message || "Failed to fetch incident audit trail.");
  }

  return response.audit_trail.map(mapIncidentAuditEntry);
}

export async function createIncident(
  userId: string,
  promoterId: string,
  title: string,
  description: string,
  imageFile: File | null
): Promise<CreateIncidentResponse> {
  const formData = new FormData();
  formData.append("token", API_TOKEN);
  formData.append("user_id", userId);
  formData.append("promoter_id", promoterId);
  formData.append("incident_name", title);
  formData.append("description", description);
  
  if (imageFile) {
    formData.append("photo", imageFile);
  }

  const response = await apiClient<CreateIncidentResponse>(CREATE_INCIDENT_PATH, {
    method: "POST",
    body: formData,
  });

  if (response.status !== 200) {
    throw new Error(response.message || "Failed to create incident.");
  }

  return response;
}
