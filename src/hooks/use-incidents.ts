import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Incident,
  UpdateIncidentStatusPayload,
  UpdateIncidentStatusResponse,
} from "../../types/incidents";
import { getIncidents, updateIncidentStatus } from "../api/incidents";
import { useAuthStore } from "../store/auth-store";

export function getIncidentsQueryKey(userId: string) {
  return ["incidents", userId];
}

export function useIncidents() {
  const userId = useAuthStore((state) => state.user?.user_id);
  const normalizedUserId = userId ? String(userId) : "";

  return useQuery<Incident[], Error>({
    queryKey: getIncidentsQueryKey(normalizedUserId),
    queryFn: () => getIncidents(normalizedUserId),
    enabled: Boolean(normalizedUserId),
  });
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.user_id);
  const normalizedUserId = userId ? String(userId) : "";

  return useMutation<UpdateIncidentStatusResponse, Error, UpdateIncidentStatusPayload>({
    mutationFn: updateIncidentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getIncidentsQueryKey(normalizedUserId),
      });
    },
  });
}
