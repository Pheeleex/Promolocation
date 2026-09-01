export const ALL_AGENCIES_VALUE = "all";

type AgencyLike = {
  agency?: string | null;
  agencyId?: string | number | null;
  agencyName?: string | null;
  agency_id?: string | number | null;
  agency_name?: string | null;
  isGlobal?: boolean | null;
  is_global?: boolean | number | string | null;
  user_role?: string | null;
} | null | undefined;

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeAgencyId(value: unknown) {
  return normalizeText(value);
}

export function normalizeAgencyName(value: unknown) {
  return normalizeText(value);
}

export function normalizeIsGlobal(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function getAgencyId(record: AgencyLike) {
  return normalizeAgencyId(record?.agencyId ?? record?.agency_id);
}

export function getAgencyName(record: AgencyLike) {
  return normalizeAgencyName(
    record?.agencyName ?? record?.agency_name ?? record?.agency,
  );
}

export function getAgencyLabel(recordOrName: AgencyLike | string | number) {
  if (
    typeof recordOrName === "string" ||
    typeof recordOrName === "number" ||
    recordOrName === null ||
    recordOrName === undefined
  ) {
    const label = normalizeAgencyName(recordOrName);
    return label || "Unassigned";
  }

  if (isGlobalAgency(recordOrName)) {
    return "All agencies";
  }

  return getAgencyName(recordOrName) || "Unassigned";
}

function isAdminLike(user: AgencyLike) {
  const role = normalizeText(user?.user_role).toLowerCase();

  return role === "admin" || role === "specialadmin" || role === "manager";
}

function isGlobalAgency(user: AgencyLike) {
  return (
    normalizeIsGlobal(user?.isGlobal ?? user?.is_global) ||
    getAgencyName(user).toLowerCase() === ALL_AGENCIES_VALUE
  );
}

export function adminCanSelectAgency(user: AgencyLike) {
  const hasAgency = Boolean(getAgencyId(user) || getAgencyName(user));

  return (
    isGlobalAgency(user) ||
    (isAdminLike(user) && !hasAgency)
  );
}

export function adminCanViewAgency(user: AgencyLike, record: AgencyLike) {
  if (adminCanSelectAgency(user)) {
    return true;
  }

  const adminAgencyId = getAgencyId(user);
  const recordAgencyId = getAgencyId(record);

  if (adminAgencyId && recordAgencyId) {
    return adminAgencyId === recordAgencyId;
  }

  const adminAgencyName = getAgencyName(user).toLowerCase();
  const recordAgencyName = getAgencyName(record).toLowerCase();

  return Boolean(adminAgencyName && recordAgencyName && adminAgencyName === recordAgencyName);
}

export function scopeRecordsByAgency<T extends AgencyLike>(records: T[], user: AgencyLike) {
  if (adminCanSelectAgency(user)) {
    return records;
  }

  return records.filter((record) => adminCanViewAgency(user, record));
}
