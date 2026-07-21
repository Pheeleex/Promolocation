export type ApiId = string | number;

export type RawPromoterBrand = {
  id: ApiId;
  user_id?: ApiId | null;
  promoter_id: string;
  brand: string;
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
  promoUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RawSystemBrand = {
  id: ApiId;
  brand: string;
  created_at: string | null;
};

export type SystemBrand = {
  id: ApiId;
  name: string;
  createdAt: string | null;
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

export type CreatePromoterBrandPayload = {
  promoterId: string;
  brandName: string;
  promoFile?: File | null;
};

export type UpdatePromoterBrandPayload = {
  id: ApiId;
  promoterId: string;
  brandName?: string;
  promoFile?: File | null;
};

export type DeletePromoterBrandPayload = {
  id: ApiId;
  promoterId: string;
};


export function mapPromoterBrand(
  brand: RawPromoterBrand,
): PromoterBrand {
  return {
    id: brand.id,
    userId: brand.user_id ?? null,
    promoterId: brand.promoter_id,
    name: brand.brand,
    promoUrl: brand.promo_URL ?? null,
    createdAt: brand.created_at ?? null,
    updatedAt: brand.updated_at ?? brand.last_updated ?? null,
  };
}
