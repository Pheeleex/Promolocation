export type ApiId = string | number;

export type RawPromoterBrand = {
  id: ApiId;
  user_id: ApiId;
  promoter_id: string;
  brand: string;
  promo_URL: string | null;
  created_at: string | null;
  updated_at?: string | null;
};

export type PromoterBrand = {
  id: ApiId;
  userId: ApiId;
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

export type GetPromoterBrandsResponse = {
  status: number;
  message: string;
  promoter_id?: string;
  total: number;
  brands: RawPromoterBrand[];
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
    userId: brand.user_id,
    promoterId: brand.promoter_id,
    name: brand.brand,
    promoUrl: brand.promo_URL,
    createdAt: brand.created_at,
    updatedAt: brand.updated_at ?? null,
  };
}
