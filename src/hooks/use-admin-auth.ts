import { useMutation } from "@tanstack/react-query";
import {
  ApiError,
  ChangePasswordPayload,
  ChangePasswordResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetAdminPasswordPayload,
  ResetAdminPasswordResponse,
} from "../../types/auth";
import { changePassword, forgotPassword, resetAdminPassword } from "../api/auth";

function ensureSuccessfulResponse(
  status: number,
  message: string,
  fallbackMessage: string,
) {
  if (status !== 200) {
    throw new ApiError(message || fallbackMessage, status);
  }
}

export function useChangePassword() {
  return useMutation<ChangePasswordResponse, ApiError, ChangePasswordPayload>({
    mutationFn: async (payload) => {
      const response = await changePassword(payload);

      ensureSuccessfulResponse(
        response.status,
        response.message,
        "Unable to change password.",
      );

      return response;
    },
  });
}

export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, ApiError, ForgotPasswordPayload>({
    mutationFn: async (payload) => {
      const response = await forgotPassword(payload);

      ensureSuccessfulResponse(
        response.status,
        response.message,
        "Unable to send reset instructions.",
      );

      return response;
    },
  });
}

export function useResetAdminPassword() {
  return useMutation<
    ResetAdminPasswordResponse,
    ApiError,
    ResetAdminPasswordPayload
  >({
    mutationFn: async (payload) => {
      const response = await resetAdminPassword(payload);

      ensureSuccessfulResponse(
        response.status,
        response.message,
        "Unable to reset password.",
      );

      return response;
    },
  });
}
