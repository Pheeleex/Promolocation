import type { Agency, ListAgenciesResponse, RawAgency } from "../../types/agencies";
import { authenticatedAdminPost } from "./loggedIn-client";
import { assertApiSuccess } from "./response";

const MANAGE_AGENCIES_PATH = "/manage_agencies";

function normalizeBoolean(value: RawAgency["is_active"]) {
  if (value === null || value === undefined) {
    return true;
  }

  return value === true || value === 1 || value === "1";
}

function normalizeCount(value: RawAgency["promotion_count"]) {
  const count = Number(value ?? 0);

  return Number.isFinite(count) ? count : 0;
}

export function mapAgency(agency: RawAgency): Agency {
  return {
    id: String(agency.id),
    name: agency.name || "",
    code: agency.code || null,
    isActive: normalizeBoolean(agency.is_active),
    promotionCount: normalizeCount(agency.promotion_count),
    userCount: normalizeCount(agency.user_count),
  };
}

export async function listAgencies(): Promise<Agency[]> {
  const response = assertApiSuccess(
    await authenticatedAdminPost<ListAgenciesResponse>(
      MANAGE_AGENCIES_PATH,
      {
        function_type: "list",
      },
    ),
  );

  return (response.agencies || []).map(mapAgency);
}
