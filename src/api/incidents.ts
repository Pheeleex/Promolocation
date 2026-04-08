import { mapIncident } from "../../types/mapper";
import {
  GetIncidentsResponse,
  Incident,
  UpdateIncidentStatusPayload,
  UpdateIncidentStatusResponse,
} from "../../types/incidents";
import { apiClient } from "./client";

const API_TOKEN = import.meta.env.VITE_API_TOKEN ?? "";
const GET_INCIDENTS_PATH = "/get_incidents";
const UPDATE_INCIDENT_STATUS_PATH = "/update_incident_status";

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
  const response = await apiClient<UpdateIncidentStatusResponse>(
    UPDATE_INCIDENT_STATUS_PATH,
    {
      method: "POST",
      body: JSON.stringify({
        token: API_TOKEN,
        ...payload,
      }),
    },
  );

  if (response.status !== 200) {
    throw new Error("Failed to update incident.");
  }

  return response;
}
