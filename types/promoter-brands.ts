export type ApiId = string | number;

export type RawPromoterBrand = {
  id: ApiId;
  user_id?: ApiId | null;
  promoter_id: string;
  brand: string;
  promotion_code?: string | null;
  promo_type?: string | null;
  promo_URL?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_updated?: string | null;
};

export type PromoterBrand = {
  id: ApiId;
  userId: ApiId | null;
  promoterId: string;
  name: string;
  promotionCode?: string | null;
  promoType?: string | null;
  promoUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RawSystemBrand = {
  id: ApiId;
  brand?: string | null;
  brand_name?: string | null;
  brand_image?: string | null;
  is_active?: number | string | boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SystemBrand = {
  id: ApiId;
  name: string;
  logoUrl: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type GetSystemBrandsResponse = {
  status: number;
  message: string;
  total: number;
  brands: RawSystemBrand[];
};

export type BrandMutationResponse = {
  status: number;
  message: string;
  promoter_id?: string;
  brand?: RawPromoterBrand;
};

export type ManageSystemBrandResponse = {
  status: number;
  message: string;
  brand?: RawSystemBrand;
  brands?: RawSystemBrand[];
};

export type CreateSystemBrandPayload = {
  brandName: string;
  brandImage?: File | null;
  isActive: boolean;
};

export type UpdateSystemBrandPayload = {
  id: ApiId;
  brandName: string;
  brandImage?: File | null;
  isActive: boolean;
};

export type DeleteSystemBrandPayload = {
  id: ApiId;
};

export type ImportBrandsCategoryPayload = {
  file: File;
};

export type ImportBrandsCategoryResult = {
  row: number;
  promoter_id?: string | null;
  promoter_code?: string | null;
  brand?: string | null;
  status: string;
  brand_id?: ApiId | null;
  promo_URL?: string | null;
  message?: string | null;
  reason?: string | null;
  error?: string | null;
};

export type ImportBrandsCategoryResponse = {
  status: number;
  message: string;
  error_count?: number;
  errors?: {
    row?: number | string | null;
    promoter_id?: string | null;
    promoter_code?: string | null;
    brand?: string | null;
    error?: string | null;
    reason?: string | null;
    message?: string | null;
  }[];
  summary: {
    total: number;
    imported: number;
    updated: number;
    failed: number;
  };
  results: ImportBrandsCategoryResult[];
};

export type CreatePromoterBrandPayload = {
  promoterId: string;
  brandName: string;
  promotionCode?: string;
  promoType?: string;
  promoFile?: File | null;
};

export type UpdatePromoterBrandPayload = {
  id: ApiId;
  promoterId: string;
  brandName?: string;
  promotionCode?: string;
  promoType?: string;
  promoFile?: File | null;
};

export type DeletePromoterBrandPayload = {
  id: ApiId;
  promoterId: string;
};

export type GetPromoterBrandsPayload = {
  promoterId: string;
};

export type GetPromoterBrandsResponse = {
  status?: number | string;
  message?: string;
  brands?: RawPromoterBrand[];
  data?: RawPromoterBrand[];
};


export function mapPromoterBrand(
  brand: RawPromoterBrand,
): PromoterBrand {
  return {
    id: brand.id,
    userId: brand.user_id ?? null,
    promoterId: brand.promoter_id,
    name: brand.brand,
    promotionCode: brand.promotion_code ?? null,
    promoType: brand.promo_type ?? null,
    promoUrl: brand.promo_URL ?? null,
    createdAt: brand.created_at ?? null,
    updatedAt: brand.updated_at ?? brand.last_updated ?? null,
  };
}
