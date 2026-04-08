import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth-store";
import { ApiError, LoginPayload, LoginResponse } from "../../types/auth";
import { login } from "../api/auth";
import { hasAdminRole } from "../utils/authAccess";

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<LoginResponse, ApiError, LoginPayload>({
    mutationFn: async (payload) => {
      const response = await login(payload);

      if (!hasAdminRole(response.user_role)) {
        throw new ApiError("Only admin users can sign in to this dashboard.", 451);
      }

      return response;
    },
    onSuccess: (data) => {
      setAuth(data);
    },
  });
}
