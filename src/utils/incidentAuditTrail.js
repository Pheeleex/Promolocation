import { hasRegularAdminRole, hasSpecialAdminRole } from "./authAccess";

const INCIDENT_AUDIT_TRAIL_STORAGE_KEY = "promolocationIncidentAuditTrail";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function createAuditEntryId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `incident_audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readIncidentAuditEntries() {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(INCIDENT_AUDIT_TRAIL_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

function writeIncidentAuditEntries(entries) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(INCIDENT_AUDIT_TRAIL_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    return;
  }
}

function normalizeComparableValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function matchesIncident(entry, incident) {
  if (!incident) {
    return false;
  }

  if (entry.incidentId && incident.id) {
    return entry.incidentId === String(incident.id);
  }

  return (
    normalizeComparableValue(entry.incidentTitle) ===
      normalizeComparableValue(incident.issue) &&
    String(entry.userId || "") === String(incident.userId || "")
  );
}

function sortByMostRecent(entries) {
  return [...entries].sort(
    (leftEntry, rightEntry) =>
      new Date(rightEntry.dateTime).getTime() - new Date(leftEntry.dateTime).getTime(),
  );
}

function getAuditActorLabel(userRole) {
  if (hasSpecialAdminRole(userRole)) {
    return "Special Admin";
  }

  if (hasRegularAdminRole(userRole)) {
    return "Admin";
  }

  return "User";
}

function addIncidentAuditEntry({
  incidentId = null,
  userId,
  incidentTitle,
  action,
  comment = null,
  dateTime = new Date().toISOString(),
}) {
  const normalizedUserId = userId ? String(userId) : "";
  const normalizedIncidentTitle = incidentTitle?.trim();
  const normalizedAction = action?.trim();
  const normalizedComment = typeof comment === "string" ? comment.trim() : "";

  if (!normalizedUserId || !normalizedIncidentTitle || !normalizedAction) {
    return null;
  }

  const nextEntry = {
    id: createAuditEntryId(),
    incidentId: incidentId ? String(incidentId) : null,
    userId: normalizedUserId,
    incidentTitle: normalizedIncidentTitle,
    action: normalizedAction,
    comment: normalizedComment || null,
    dateTime,
  };

  const currentEntries = readIncidentAuditEntries();
  writeIncidentAuditEntries([...currentEntries, nextEntry]);

  return nextEntry;
}

export function getIncidentAuditTrail(incident) {
  if (!incident) {
    return [];
  }

  const auditEntries = readIncidentAuditEntries();

  return sortByMostRecent(auditEntries.filter((entry) => matchesIncident(entry, incident)));
}

export function recordIncidentSubmissionAuditEntry({
  incidentId,
  userId,
  incidentTitle,
  userRole,
  comment,
}) {
  return addIncidentAuditEntry({
    incidentId,
    userId,
    incidentTitle,
    action: `${getAuditActorLabel(userRole)} submitted incident`,
    comment,
  });
}

export function recordIncidentStatusAuditEntry({
  incidentId,
  userId,
  incidentTitle,
  userRole,
  nextStatus,
  comment,
}) {
  return addIncidentAuditEntry({
    incidentId,
    userId,
    incidentTitle,
    action: `${getAuditActorLabel(userRole)} updated status to ${nextStatus}`,
    comment,
  });
}
