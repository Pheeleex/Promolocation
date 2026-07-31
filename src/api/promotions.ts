import type {
  CreatePromotionPayload,
  DeletePromotionPayload,
  GetPromotionBrandsPayload,
  GetPromotionBrandsResponse,
  ListPromotionsPayload,
  ListPromotionsResponse,
  ManagePromotionResponse,
  Promotion,
  PromotionAssignment,
  PromotionStatus,
  RawPromotionBrand,
  RawPromotion,
  UpdatePromotionPayload,
  UploadPromotionQrCodesPayload,
  UploadPromotionQrCodesResponse,
} from "../../types/promotions";
import {
  authenticatedAdminFormPost,
  authenticatedAdminPost,
} from "./loggedIn-client";
import { assertApiSuccess } from "./response";

const MANAGE_PROMOTIONS_PATH = "/manage_promotions";
const UPLOAD_QR_CODES_BULK_PATH = "/upload_qr_codes_bulk";
const GET_BRANDS_BY_PROMOTION_PATH = "/get_brands_by_promotion";

function normalizeIsActive(isActive: RawPromotion["is_active"], status?: string | null) {
  if (isActive === true || isActive === 1 || isActive === "1") {
    return true;
  }

  if (isActive === false || isActive === 0 || isActive === "0") {
    return false;
  }

  return status === "active";
}

function normalizePromotionStatus(status?: string | null): PromotionStatus {
  if (
    status === "draft" ||
    status === "active" ||
    status === "inactive" ||
    status === "expired"
  ) {
    return status;
  }

  return "inactive";
}

function normalizePromotionActive(isActive: RawPromotionBrand["promotion_active"]) {
  return isActive === true || isActive === 1 || isActive === "1";
}

function resolvePromotionStatus(
  status: PromotionStatus,
  isActive: boolean,
): PromotionStatus {
  if (isActive) {
    return "active";
  }

  if (status === "active") {
    return "inactive";
  }

  return status;
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function toApiDateTime(value: string, time: "start" | "end") {
  if (!value) {
    return "";
  }

  if (value.includes(":")) {
    return value;
  }

  return `${value} ${time === "start" ? "00:00:00" : "23:59:59"}`;
}

export function mapPromotion(promotion: RawPromotion): Promotion {
  const rawStatus = normalizePromotionStatus(promotion.status);
  const isActive = normalizeIsActive(promotion.is_active, rawStatus);
  const status = resolvePromotionStatus(rawStatus, isActive);

  return {
    id: promotion.id,
    promotionCode: promotion.promotion_code || String(promotion.id),
    name: promotion.name || "",
    description: promotion.description || "",
    imageUrl: promotion.promotion_image || null,
    startDate: toDateInputValue(promotion.start_date),
    endDate: toDateInputValue(promotion.end_date),
    status,
    isActive,
    createdAt: promotion.created_at || null,
    updatedAt: promotion.updated_at || null,
    assignments: [],
  };
}

function mapPromotionBrand(brand: RawPromotionBrand): PromotionAssignment {
  return {
    id: brand.id,
    promoterId: brand.promoter_id || "",
    brandName: brand.brand || "",
    qrPath: brand.promo_URL || "",
    brandImageUrl: brand.brand_image || null,
    promotionCode: brand.promotion_code || "",
    promotionName: brand.promotion_name || null,
    promotionActive: normalizePromotionActive(brand.promotion_active),
    createdAt: brand.created_at || "",
  };
}

function buildPromotionFormData(
  payload: CreatePromotionPayload | UpdatePromotionPayload,
  functionType: "create" | "update",
) {
  const formData = new FormData();

  formData.set("function_type", functionType);

  if ("id" in payload) {
    formData.set("id", String(payload.id));
  }

  if (payload.name !== undefined) {
    formData.set("name", payload.name.trim());
  }

  if (payload.description !== undefined) {
    formData.set("description", payload.description.trim());
  }

  if (payload.startDate !== undefined) {
    formData.set("start_date", toApiDateTime(payload.startDate, "start"));
  }

  if (payload.endDate !== undefined) {
    formData.set("end_date", toApiDateTime(payload.endDate, "end"));
  }

  if (payload.status !== undefined) {
    formData.set("status", payload.status);
  }

  if (payload.isActive !== undefined) {
    formData.set("is_active", payload.isActive ? "1" : "0");
  }

  return formData;
}

export async function listPromotions(
  payload: ListPromotionsPayload = {},
): Promise<Promotion[]> {
  const response = assertApiSuccess(
    await authenticatedAdminPost<ListPromotionsResponse>(
      MANAGE_PROMOTIONS_PATH,
      {
        function_type: "list",
        page: payload.page ?? 1,
        per_page: payload.perPage ?? 100,
      },
    ),
  );

  return (response.promotions || []).map(mapPromotion);
}

export async function createPromotion(
  payload: CreatePromotionPayload,
): Promise<Promotion> {
  const response = assertApiSuccess(
    await authenticatedAdminFormPost<ManagePromotionResponse>(
      MANAGE_PROMOTIONS_PATH,
      buildPromotionFormData(payload, "create"),
    ),
  );

  if (!response.promotion) {
    throw new Error("The server did not return the created promotion.");
  }

  return mapPromotion(response.promotion);
}

export async function updatePromotion(
  payload: UpdatePromotionPayload,
): Promise<Promotion> {
  const response = assertApiSuccess(
    await authenticatedAdminFormPost<ManagePromotionResponse>(
      MANAGE_PROMOTIONS_PATH,
      buildPromotionFormData(payload, "update"),
    ),
  );

  if (!response.promotion) {
    throw new Error("The server did not return the updated promotion.");
  }

  return mapPromotion(response.promotion);
}

export async function deletePromotion(payload: DeletePromotionPayload): Promise<void> {
  console.log("Deleting promotion with payload:", payload);
  assertApiSuccess(
    await authenticatedAdminPost<ManagePromotionResponse>(
      MANAGE_PROMOTIONS_PATH,
      {
        function_type: "delete",
        id: payload.id,
      },
    ),
  );
}

export async function uploadPromotionQrCodesBulk(
  payload: UploadPromotionQrCodesPayload,
): Promise<UploadPromotionQrCodesResponse> {
  const formData = new FormData();

  formData.set("file", payload.file);

  return assertApiSuccess(
    await authenticatedAdminFormPost<UploadPromotionQrCodesResponse>(
      UPLOAD_QR_CODES_BULK_PATH,
      formData,
    ),
  );
}

export async function getBrandsByPromotion(
  payload: GetPromotionBrandsPayload,
): Promise<PromotionAssignment[]> {
  const response = assertApiSuccess(
    await authenticatedAdminPost<GetPromotionBrandsResponse>(
      GET_BRANDS_BY_PROMOTION_PATH,
      {
        promotion_code: payload.promotionCode,
      },
    ),
  );

  return (response.brands || []).map(mapPromotionBrand);
}
