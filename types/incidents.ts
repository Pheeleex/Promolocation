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

export type RawIncidentAuditEntry = {
  audit_id: string | number;
  incident_id: string | number;
  user_id: string | number;
  incident_title: string;
  action: string;
  comment: string | null;
  date_time: string;
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
  | "On Hold"
  | "Resolved"
  | "Not Resolved"
  | "Closed";

export type EditableIncidentStatus =
  | "In Progress"
  | "On Hold"
  | "Resolved"
  | "Not Resolved"
  | "Closed";

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

export type IncidentAuditEntry = {
  id: string;
  incidentId: string;
  userId: string;
  incidentTitle: string;
  action: string;
  comment: string | null;
  dateTime: string;
};

export type UpdateIncidentStatusPayload = {
  incident_id: string;
  status: EditableIncidentStatus;
  comment?: string;
};

export type UpdateIncidentStatusResponse = {
  status: number;
  message: string;
  incident?: {
    incident_id?: string | number;
    status?: IncidentStatus;
    comment?: string | null;
    admin_note?: string | null;
  };
};

export type GetIncidentAuditTrailResponse = {
  status: number;
  message: string;
  audit_trail: RawIncidentAuditEntry[];
};

export type CreateIncidentResponse = {
  status: number;
  message: string;
  incident?: RawIncident;
};
