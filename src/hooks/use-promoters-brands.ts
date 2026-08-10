import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPromoterBrand,
  createSystemBrand,
  deletePromoterBrand,
  deleteSystemBrand,
  getPromoterBrands,
  getSystemBrands,
  importBrandsCategory,
  listManagedSystemBrands,
  updateSystemBrand,
  updatePromoterBrand,
} from "../api/promoters-brands";

export const promoterBrandKeys = {
  all: ["promoter-brands"] as const,
  system: ["promoter-brands", "system"] as const,
  managedSystem: ["promoter-brands", "managed-system"] as const,
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

export function useManagedSystemBrands() {
  return useQuery({
    queryKey: promoterBrandKeys.managedSystem,
    queryFn: listManagedSystemBrands,
  });
}

export function usePromoterBrands(promoterId: string, enabled = true) {
  return useQuery({
    queryKey: promoterBrandKeys.promoter(promoterId),
    queryFn: () => getPromoterBrands({ promoterId }),
    enabled: enabled && Boolean(promoterId),
  });
}

function useInvalidateSystemBrandQueries() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: promoterBrandKeys.system });
    queryClient.invalidateQueries({ queryKey: promoterBrandKeys.managedSystem });
  };
}

export function useCreateSystemBrand() {
  const invalidateSystemBrands = useInvalidateSystemBrandQueries();

  return useMutation({
    mutationFn: createSystemBrand,
    onSuccess: invalidateSystemBrands,
  });
}

export function useUpdateSystemBrand() {
  const invalidateSystemBrands = useInvalidateSystemBrandQueries();

  return useMutation({
    mutationFn: updateSystemBrand,
    onSuccess: invalidateSystemBrands,
  });
}

export function useDeleteSystemBrand() {
  const invalidateSystemBrands = useInvalidateSystemBrandQueries();

  return useMutation({
    mutationFn: deleteSystemBrand,
    onSuccess: invalidateSystemBrands,
  });
}

export function useImportBrandsCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importBrandsCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
      queryClient.invalidateQueries({ queryKey: promoterBrandKeys.all });
    },
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
      if (variables.promotionCode) {
        queryClient.invalidateQueries({
          queryKey: ["promotions", "brands", variables.promotionCode],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["promotions", "qr-codes"] });
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
      if (variables.promotionCode) {
        queryClient.invalidateQueries({
          queryKey: ["promotions", "brands", variables.promotionCode],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["promotions", "qr-codes"] });
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
