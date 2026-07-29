import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
  uploadPromotionQrCodesBulk,
} from "../api/promotions";

export const promotionKeys = {
  all: ["promotions"] as const,
  list: ["promotions", "list"] as const,
};

export function usePromotions() {
  return useQuery({
    queryKey: promotionKeys.list,
    queryFn: () => listPromotions(),
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.all });
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.all });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.all });
    },
  });
}

export function useUploadPromotionQrCodesBulk() {
  return useMutation({
    mutationFn: uploadPromotionQrCodesBulk,
  });
}
