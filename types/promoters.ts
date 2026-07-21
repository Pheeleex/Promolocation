// src/types/promoters.ts
import type { PromoterBrand, RawPromoterBrand } from "./promoter-brands";

export type RawPromoter = {
  id: string;
  ip_address: string;
  username: string;
  promoter_id: string;
  password: string;
  salt: string | null;
  email: string;
  activation_selector: string | null;
  dept: string | null;
  activation_code: string | null;
  forgotten_password_selector: string | null;
  forgotten_password_code: string | null;
  forgotten_password_time: string | null;
  remember_selector: string | null;
  remember_code: string | null;
  created_on: string | number | null;
  updated_at: string | null;
  last_login: string | null;
  active: string;
  first_name: string;
  last_name: string;
  fullname: string;
  phone: string;
  designation: string | null;
  address: string;
  user_role: string;
  move_in_date: string | null;
  image: string | null;
  avatar: string;
  proof_of_document: string;
  region: string;
  area: string;
  resetKey: string;
  profile_status: string;
  emergency_contact: string;
  privacy_view: string;
  push_notification: string;
  device_token: string | null;
  promo_code: string | null;
  brands?: RawPromoterBrand[];
};

export type GetUsersResponse = {
  status: number;
  users: RawPromoter[];
};

export type PromoterStatus = "Active" | "Inactive";

export type Promoter = {
  id: string;
  promoterId: string;
  promoterCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  status: PromoterStatus;
  createdOn: string;
  createdOnTime: number;
  lastUpdated: string;
  lastUpdatedTime: number;
  address: string;
  designation: string | null;
  region: string;
  area: string;
  avatar: string;
  image: string | null;
  emergencyContact: string;
  profileStatus: boolean;
  brands: PromoterBrand[];
};

// src/types/promoter.ts

export type CreatePromoterPayload = {
  promoter_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  brand?: string;
  promo_code?: string;
  promo_URL?: File;
  brands?: {
    brand: string;
    promo_URL?: File | null;
  }[];
};

export type UpdatePromoterStatusValue = "active" | "inactive";

export type UpdatePromoterPayload = {
  user_id: string;
  user_role?: string;
  promoter_id: string;
  first_name: string;
  last_name: string;
  status: UpdatePromoterStatusValue;
};

export type ResetPromoterPasswordPayload = {
  user_id: string | number;
};

export type CreatePromoterResponse = {
  status: number;
  message: string;
  user?: {
    id?: string;
    promoter_id?: string;
    first_name?: string;
    last_name?: string;
    fullname?: string;
    user_role?: string;
    email?: string;
  };
  brands?: {
    id?: string | number;
    promoter_id?: string;
    brand?: string;
    promo_URL?: string | null;
    created_at?: string | null;
  }[];
};

export type UpdatePromoterResponse = {
  status: number;
  message: string;
  user?: {
    id?: string;
    promoter_id?: string;
    first_name?: string;
    last_name?: string;
    status?: UpdatePromoterStatusValue | PromoterStatus;
  };
};

export type ResetPromoterPasswordResponse = {
  status?: number;
  message?: string;
  user?: {
    id?: string | number;
    promoter_id?: string;
  };
  reset_requested_at?: string;
};
