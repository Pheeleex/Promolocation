import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth-store";
import { ApiError, LoginPayload, LoginResponse } from "../../types/auth";
import { login } from "../api/auth";
import { hasAdminRole } from "../utils/authAccess";
import { DASHBOARD_TEAM_LABEL } from "../utils/uiLabels";

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<LoginResponse, ApiError, LoginPayload>({
    mutationFn: async (payload) => {
      if (import.meta.env.DEV) {
        console.log("[useLogin] payload", payload);
      }

      const response = await login(payload);

      if (import.meta.env.DEV) {
        console.log("[useLogin] response", response);
      }

      if (!hasAdminRole(response.user_role)) {
        console.log(response.user_role, "your role");
        throw new ApiError(
          `Only ${DASHBOARD_TEAM_LABEL} users can sign in to this dashboard.`,
          451,
        );
      }

      return response;
    },
    onSuccess: (data) => {
      setAuth(data);
    },
  });
}
