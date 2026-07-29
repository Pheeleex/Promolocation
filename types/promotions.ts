import type { ApiId } from "./promoter-brands";

export type PromotionStatus = "draft" | "active" | "inactive" | "expired";

export type RawPromotion = {
  id: ApiId;
  promotion_code?: string | null;
  name: string;
  description?: string | null;
  promotion_image?: string | null;
  start_date: string;
  end_date: string;
  status?: PromotionStatus | string | null;
  is_active?: number | string | boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Promotion = {
  id: ApiId;
  promotionCode: string;
  name: string;
  description: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  assignments: PromotionAssignment[];
};

export type PromotionAssignment = {
  id: ApiId;
  row?: number;
  promotionCode?: string;
  promoterId: string;
  brandName: string;
  qrPath: string;
  createdAt?: string;
};

export type ListPromotionsResponse = {
  status: number | string;
  message: string;
  total: number;
  page: number;
  per_page: number;
  promotions: RawPromotion[];
};

export type ManagePromotionResponse = {
  status: number | string;
  message: string;
  promotion?: RawPromotion;
  promotion_id?: ApiId;
};

export type ListPromotionsPayload = {
  page?: number;
  perPage?: number;
};

export type CreatePromotionPayload = {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  isActive?: boolean;
  promotionImage?: File | null;
};

export type UpdatePromotionPayload = {
  id: ApiId;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: PromotionStatus;
  isActive?: boolean;
  promotionImage?: File | null;
};

export type DeletePromotionPayload = {
  id: ApiId;
};

export type UploadPromotionQrCodesPayload = {
  file: File;
};

export type UploadPromotionQrCodesResponse = {
  status: number | string;
  message: string;
  [key: string]: unknown;
};
