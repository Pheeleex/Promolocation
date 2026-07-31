import {
  BrandMutationResponse,
  CreateSystemBrandPayload,
  CreatePromoterBrandPayload,
  DeleteSystemBrandPayload,
  DeletePromoterBrandPayload,
  GetPromoterBrandsPayload,
  GetPromoterBrandsResponse,
  GetSystemBrandsResponse,
  ImportBrandsCategoryPayload,
  ImportBrandsCategoryResponse,
  ManageSystemBrandResponse,
  PromoterBrand,
  RawSystemBrand,
  SystemBrand,
  UpdateSystemBrandPayload,
  UpdatePromoterBrandPayload,
} from "../../types/promoter-brands";
import {
  authenticatedAdminFormPost,
  authenticatedAdminPost,
  tokenPost,
} from "./loggedIn-client";
import { assertApiSuccess } from "./response";

const CREATE_PROMOTER_BRAND_PATH = "/create_promoter_brand";
const MANAGE_PROMOTER_BRAND_PATH = "/manage_promoter_brand";
const GET_PROMOTER_BRANDS_PATH = "/get_promoter_brands";
const GET_SYSTEM_BRANDS_PATH = "/get_system_brands";
const MANAGE_SYSTEM_BRANDS_PATH = "/manage_brands";
const IMPORT_BRANDS_CATEGORY_PATH = "/import_brands_category";

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

function normalizeIsActive(isActive: RawSystemBrand["is_active"]) {
  if (isActive === null || isActive === undefined) {
    return null;
  }

  return isActive === true || isActive === 1 || isActive === "1";
}

export function mapSystemBrand(brand: RawSystemBrand): SystemBrand | null {
  const name = (brand.brand_name ?? brand.brand ?? "").trim();

  if (!name) {
    return null;
  }

  return {
    id: brand.id,
    name,
    logoUrl: brand.brand_image ?? null,
    isActive: normalizeIsActive(brand.is_active),
    createdAt: brand.created_at ?? null,
    updatedAt: brand.updated_at ?? null,
  };
}

export async function getSystemBrands(): Promise<SystemBrand[]> {
  const response = assertApiSuccess<GetSystemBrandsResponse>(
    await tokenPost<GetSystemBrandsResponse>(
      GET_SYSTEM_BRANDS_PATH,
    ),
  );

  return response.brands
    .map(mapSystemBrand)
    .filter((brand): brand is SystemBrand => Boolean(brand));
}

export async function getPromoterBrands(
  payload: GetPromoterBrandsPayload,
): Promise<PromoterBrand[]> {
  const response = assertApiSuccess(
    await authenticatedAdminPost<GetPromoterBrandsResponse>(
      GET_PROMOTER_BRANDS_PATH,
      {
        promoter_id: payload.promoterId,
      },
    ),
  );
  const brands = Array.isArray(response)
    ? response
    : response.brands || response.data || [];

  return brands.map(mapPromoterBrand);
}

function mapSystemBrands(brands?: RawSystemBrand[]): SystemBrand[] {
  return (brands ?? [])
    .map(mapSystemBrand)
    .filter((brand): brand is SystemBrand => Boolean(brand));
}

function buildSystemBrandFormData(
  payload: CreateSystemBrandPayload | UpdateSystemBrandPayload,
  functionType: "create" | "update",
) {
  const formData = new FormData();

  formData.set("function_type", functionType);
  formData.set("brand_name", payload.brandName.trim());
  formData.set("is_active", payload.isActive ? "1" : "0");

  if ("id" in payload) {
    formData.set("id", String(payload.id));
  }

  if (payload.brandImage) {
    formData.set("brand_image", payload.brandImage);
  }

  return formData;
}

export async function listManagedSystemBrands(): Promise<SystemBrand[]> {
  const response = assertApiSuccess(
    await authenticatedAdminPost<ManageSystemBrandResponse>(
      MANAGE_SYSTEM_BRANDS_PATH,
      {
        function_type: "list",
      },
    ),
  );

  return mapSystemBrands(response.brands);
}

export async function createSystemBrand(
  payload: CreateSystemBrandPayload,
): Promise<SystemBrand> {
  const response = assertApiSuccess(
    await authenticatedAdminFormPost<ManageSystemBrandResponse>(
      MANAGE_SYSTEM_BRANDS_PATH,
      buildSystemBrandFormData(payload, "create"),
    ),
  );

  const brand = response.brand ? mapSystemBrand(response.brand) : null;

  if (!brand) {
    throw new Error("The server did not return the created brand.");
  }

  return brand;
}

export async function updateSystemBrand(
  payload: UpdateSystemBrandPayload,
): Promise<SystemBrand> {
  const response = assertApiSuccess(
    await authenticatedAdminFormPost<ManageSystemBrandResponse>(
      MANAGE_SYSTEM_BRANDS_PATH,
      buildSystemBrandFormData(payload, "update"),
    ),
  );

  const brand = response.brand ? mapSystemBrand(response.brand) : null;

  if (!brand) {
    throw new Error("The server did not return the updated brand.");
  }

  return brand;
}

export async function deleteSystemBrand(
  payload: DeleteSystemBrandPayload,
): Promise<void> {
  assertApiSuccess(
    await authenticatedAdminPost<ManageSystemBrandResponse>(
      MANAGE_SYSTEM_BRANDS_PATH,
      {
        function_type: "delete",
        id: payload.id,
      },
    ),
  );
}

export async function importBrandsCategory(
  payload: ImportBrandsCategoryPayload,
): Promise<ImportBrandsCategoryResponse> {
  const formData = new FormData();

  formData.set("file", payload.file);

  return assertApiSuccess(
    await authenticatedAdminFormPost<ImportBrandsCategoryResponse>(
      IMPORT_BRANDS_CATEGORY_PATH,
      formData,
    ),
  );
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
