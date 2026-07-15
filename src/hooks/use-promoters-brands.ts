import { useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPromoterBrand,
  deletePromoterBrand,
  getPromoterBrands,
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

export function usePromoterBrands(promoterId?: string, enabled = true) {
  return useQuery({
    queryKey: promoterBrandKeys.promoter(promoterId || ""),
    queryFn: () => getPromoterBrands(promoterId!),
    enabled: Boolean(promoterId) && enabled,
  });
}

export function usePromoterBrandsForPromoters(promoterIds: string[]) {
  const uniquePromoterIds = useMemo(
    () =>
      Array.from(
        new Set(promoterIds.map((promoterId) => promoterId.trim()).filter(Boolean)),
      ),
    [promoterIds],
  );
  const results = useQueries({
    queries: uniquePromoterIds.map((promoterId) => ({
      queryKey: promoterBrandKeys.promoter(promoterId),
      queryFn: () => getPromoterBrands(promoterId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  return useMemo(() => {
    const brandsByPromoterId = new Map();

    uniquePromoterIds.forEach((promoterId, index) => {
      brandsByPromoterId.set(promoterId, results[index]?.data ?? []);
    });

    return {
      brandsByPromoterId,
      isLoading: results.some((result) => result.isLoading),
    };
  }, [results, uniquePromoterIds]);
}

export function useCreatePromoterBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPromoterBrand,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: promoterBrandKeys.promoter(variables.promoterId),
      });
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
    },
  });
}
