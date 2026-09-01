import { useQuery } from "@tanstack/react-query";
import { listAgencies } from "../api/agencies";

export const agencyKeys = {
  all: ["agencies"] as const,
  list: ["agencies", "list"] as const,
};

export function useAgencies(enabled = true) {
  return useQuery({
    queryKey: agencyKeys.list,
    queryFn: listAgencies,
    enabled,
  });
}
