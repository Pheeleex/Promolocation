import { mapIncident } from "../../types/mapper";
import {
  CreateIncidentResponse,
  GetIncidentsResponse,
  Incident,
  UpdateIncidentStatusPayload,
  UpdateIncidentStatusResponse,
} from "../../types/incidents";
import { apiClient } from "./client";

const API_TOKEN = import.meta.env.VITE_API_TOKEN ?? "";
const GET_INCIDENTS_PATH = "/get_incidents";
const UPDATE_INCIDENT_STATUS_PATH = "/update_incident_status";
const CREATE_INCIDENT_PATH = "/create_incident";

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
  const requestBody = {
    token: API_TOKEN,
    ...payload,
  };

  if (import.meta.env.DEV) {
    console.log("[updateIncidentStatus] request", {
      path: UPDATE_INCIDENT_STATUS_PATH,
      payload: {
        ...requestBody,
        token: API_TOKEN ? "[present]" : "[missing]",
      },
    });
  }

  let response: UpdateIncidentStatusResponse;

  try {
    response = await apiClient<UpdateIncidentStatusResponse>(
      UPDATE_INCIDENT_STATUS_PATH,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      },
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[updateIncidentStatus] error", error);
    }

    throw error;
  }

  if (import.meta.env.DEV) {
    console.log("[updateIncidentStatus] response", response);
  }

  if (response.status !== 200) {
    throw new Error("Failed to update incident.");
  }

  return response;
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
