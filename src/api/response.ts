// src/api/api-response.ts

import { ApiError } from "../../types/auth";

export type BaseApiResponse = {
  status: number | string;
  message?: string;
};

function getLogicalStatus(status: number | string) {
  if (typeof status === "number") {
    return status;
  }

  const normalizedStatus = Number(status);

  return Number.isFinite(normalizedStatus) ? normalizedStatus : 0;
}

export function assertApiSuccess<T extends BaseApiResponse>(
  response: T,
): T {
  const logicalStatus = getLogicalStatus(response.status);

  if (logicalStatus < 200 || logicalStatus >= 300) {
    throw new ApiError(
      response.message || "The request could not be completed.",
      logicalStatus,
      response,
    );
  }

  return response;
}
