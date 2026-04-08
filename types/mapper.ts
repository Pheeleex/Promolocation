import { Incident, RawIncident } from "./incidents";
import { Promoter, PromoterStatus, RawPromoter } from "./promoters";

export function mapPromoter(user: RawPromoter): Promoter {
  const status: PromoterStatus = user.active === "1" ? "Active" : "Inactive";

  return {
    id: user.id,
    promoterId: user.promoter_id,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: user.fullname.replace(/\s+/g, " ").trim(),
    email: user.email,
    phone: user.phone,
    role: user.user_role,
    active: status === "Active",
    status,
    address: user.address,
    designation: user.designation,
    region: user.region.replace(/\s+/g, " ").trim(),
    area: user.area,
    avatar: user.avatar,
    image: user.image,
    emergencyContact: user.emergency_contact,
    profileStatus: user.profile_status === "Yes",
  };
}

function normalizeIncidentDate(dateTime: string) {
  return dateTime.replace(" ", "T");
}

function normalizeIncidentStatus(status: string): Incident["status"] {
  const normalizedStatus = status.trim().toLowerCase().replace(/[_-]+/g, " ");

  switch (normalizedStatus) {
    case "pending":
      return "Pending";
    case "in progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "not resolved":
    case "deny":
    case "denied":
      return "Not Resolved";
    case "closed":
      return "Closed";
    default:
      return status as Incident["status"];
  }
}

export function mapIncident(incident: RawIncident): Incident {
  return {
    id: incident.incident_id,
    promoterId: incident.promoter_id,
    userId: incident.user_id,
    issue: incident.incident_name,
    category: incident.issue_category,
    description: incident.description,
    status: normalizeIncidentStatus(incident.status),
    date: normalizeIncidentDate(incident.created_at),
    image: incident.photo,
    adminNote: incident.admin_note,
  };
}
