import type { ApiId } from "./promoter-brands";

export type RawAgency = {
  id: ApiId;
  name: string;
  code?: string | null;
  is_active?: number | string | boolean | null;
  promotion_count?: number | string | null;
  user_count?: number | string | null;
};

export type Agency = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  promotionCount: number;
  userCount: number;
};

export type ListAgenciesResponse = {
  status: number | string;
  message?: string;
  agencies?: RawAgency[];
};
