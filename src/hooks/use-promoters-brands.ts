import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPromoterBrand,
  deletePromoterBrand,
  getSystemBrands,
  updatePromoterBrand,
} from "../api/promoters-brands";

export const promoterBrandKeys = {
  all: ["promoter-brands"] as const,
  system: ["promoter-brands", "system"] as const,
  promoter: (promoterId: string) =>
    ["promoter-brands", "promoter", promoterId] as const,
};

export function useSystemBrands() {
  return useQuery({
    queryKey: promoterBrandKeys.system,
    queryFn: getSystemBrands,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreatePromoterBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPromoterBrand,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: promoterBrandKeys.promoter(variables.promoterId),
      });
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
    },
  });
}

export function useUpdatePromoterBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePromoterBrand,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: promoterBrandKeys.promoter(variables.promoterId),
      });
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
    },
  });
}

export function useDeletePromoterBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePromoterBrand,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: promoterBrandKeys.promoter(variables.promoterId),
      });
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
    },
  });
}
