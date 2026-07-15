// src/api/api-response.ts

import { ApiError } from "../../types/auth";

export type BaseApiResponse = {
  status: number;
  message?: string;
};

export function assertApiSuccess<T extends BaseApiResponse>(
  response: T,
): T {
  if (response.status !== 200) {
    throw new ApiError(
      response.message || "The request could not be completed.",
      response.status,
      response,
    );
  }

  return response;
}