export type RawIncident = {
  incident_id: string;
  incident_name: string;
  issue_category: string;
  description: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string | null;
  photo: string | null;
  promoter_id: string;
  user_id: string;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
};

export type IncidentSummary = {
  pending: number;
  in_progress: number;
  resolved: number;
};

export type GetIncidentsResponse = {
  status: number;
  message: string;
  total: number;
  summary: IncidentSummary;
  incidents: RawIncident[];
};

export type IncidentStatus =
  | "Pending"
  | "In Progress"
  | "Resolved"
  | "Deny"
  | "Closed";

export type EditableIncidentStatus = "In Progress" | "Deny" | "Resolved";

export type Incident = {
  id: string;
  promoterId: string;
  userId: string;
  issue: string;
  category: string;
  description: string;
  status: IncidentStatus;
  date: string;
  image: string | null;
  adminNote: string | null;
};

export type UpdateIncidentStatusPayload = {
  admin_id: string;
  incident_id: string;
  status: EditableIncidentStatus;
  admin_note: string;
};

export type UpdateIncidentStatusResponse = {
  status: number;
  message: string;
  incident?: {
    incident_id?: string;
    status?: IncidentStatus;
    admin_note?: string | null;
  };
};
export type CreateIncidentResponse = {
  status: number;
  message: string;
  incident?: RawIncident;
};
