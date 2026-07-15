import {
  BrandMutationResponse,
  CreatePromoterBrandPayload,
  DeletePromoterBrandPayload,
  GetPromoterBrandsResponse,
  GetSystemBrandsResponse,
  PromoterBrand,
  SystemBrand,
  UpdatePromoterBrandPayload,
} from "../../types/promoter-brands";
import {
  authenticatedAdminFormPost,
  authenticatedAdminPost,
  tokenPost,
} from "./loggedIn-client";
import { assertApiSuccess } from "./response";

const GET_PROMOTER_BRANDS_PATH = "/get_promoter_brands";
const CREATE_PROMOTER_BRAND_PATH = "/create_promoter_brand";
const MANAGE_PROMOTER_BRAND_PATH = "/manage_promoter_brand";
const GET_SYSTEM_BRANDS_PATH = "/get_system_brands";

function mapPromoterBrand(brand: any): PromoterBrand {
  return {
    id: brand.id,
    userId: brand.user_id,
    promoterId: brand.promoter_id,
    name: brand.brand,
    promoUrl: brand.promo_URL || null,
    createdAt: brand.created_at || null,
    updatedAt: brand.updated_at || null,
  };
}

export async function getSystemBrands(): Promise<SystemBrand[]> {
  const response = assertApiSuccess<GetSystemBrandsResponse>(
    await tokenPost<GetSystemBrandsResponse>(
      GET_SYSTEM_BRANDS_PATH,
    ),
  );

  return response.brands.map((brand) => ({
    id: brand.id,
    name: brand.brand,
    createdAt: brand.created_at,
  }));
}

export async function getPromoterBrands(
  promoterId: string,
): Promise<PromoterBrand[]> {
  const response = assertApiSuccess(
    await tokenPost<GetPromoterBrandsResponse>(
      GET_PROMOTER_BRANDS_PATH,
      {
        promoter_id: promoterId,
      },
    ),
  );

  return response.brands.map(mapPromoterBrand);
}

export async function createPromoterBrand(
  payload: CreatePromoterBrandPayload,
): Promise<PromoterBrand> {
  const brandName = payload.brandName.trim();

  if (!payload.promoFile) {
    const response = assertApiSuccess(
      await authenticatedAdminPost<BrandMutationResponse>(
        CREATE_PROMOTER_BRAND_PATH,
        {
          promoter_id: payload.promoterId,
          brand: brandName,
        },
      ),
    );

    if (!response.brand) {
      throw new Error("The server did not return the created brand.");
    }

    return mapPromoterBrand(response.brand);
  }

  const formData = new FormData();
  formData.set("promoter_id", payload.promoterId);
  formData.set("brand", brandName);
  formData.set("promo_URL", payload.promoFile);

  const response = assertApiSuccess(
    await authenticatedAdminFormPost<BrandMutationResponse>(
      CREATE_PROMOTER_BRAND_PATH,
      formData,
    ),
  );

  if (!response.brand) {
    throw new Error("The server did not return the created brand.");
  }

  return mapPromoterBrand(response.brand);
}

export async function updatePromoterBrand(
  payload: UpdatePromoterBrandPayload,
): Promise<PromoterBrand> {
  const brandName = payload.brandName?.trim();

  if (!payload.promoFile) {
    const response = assertApiSuccess(
      await authenticatedAdminPost<BrandMutationResponse>(
        MANAGE_PROMOTER_BRAND_PATH,
        {
          id: payload.id,
          function_type: "update",
          ...(brandName ? { brand: brandName } : {}),
        },
      ),
    );

    if (!response.brand) {
      throw new Error("The server did not return the updated brand.");
    }

    return mapPromoterBrand(response.brand);
  }

  const formData = new FormData();
  formData.set("id", String(payload.id));
  formData.set("function_type", "update");

  if (brandName) {
    formData.set("brand", brandName);
  }

  formData.set("promo_URL", payload.promoFile);

  const response = assertApiSuccess(
    await authenticatedAdminFormPost<BrandMutationResponse>(
      MANAGE_PROMOTER_BRAND_PATH,
      formData,
    ),
  );

  if (!response.brand) {
    throw new Error("The server did not return the updated brand.");
  }

  return mapPromoterBrand(response.brand);
}

export async function deletePromoterBrand(
  payload: DeletePromoterBrandPayload,
): Promise<void> {
  assertApiSuccess(
    await authenticatedAdminPost<BrandMutationResponse>(
      MANAGE_PROMOTER_BRAND_PATH,
      {
        id: payload.id,
        function_type: "delete",
      },
    ),
  );
}
