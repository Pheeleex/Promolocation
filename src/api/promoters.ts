import { mapPromoter } from "../../types/mapper";
import {
  CreatePromoterPayload,
  CreatePromoterResponse,
  GetUsersResponse,
  Promoter,
  ResetPromoterPasswordPayload,
  ResetPromoterPasswordResponse,
  UpdatePromoterPayload,
  UpdatePromoterResponse,
} from "../../types/promoters";
import { authenticatedFormPost, authenticatedPost } from "./loggedIn-client";

const GET_USERS_PATH = "/get_users";
const CREATE_PROMOTER_PATH = "/create_promoter";
const UPDATE_PROMOTER_PATH = "/update_user_role";
const RESET_PROMOTER_PASSWORD_PATH = "/admin_reset_user_password";

export async function getPromoters(): Promise<Promoter[]> {
  const response = await authenticatedPost<GetUsersResponse>(GET_USERS_PATH);

  if (response.status !== 200) {
    throw new Error("Failed to fetch promoters.");
  }

  return response.users.map(mapPromoter);
}


export async function createPromoter(
  payload: CreatePromoterPayload
): Promise<CreatePromoterResponse> {
  const formData = new FormData();
  formData.append("promoter_id", payload.promoter_id);
  formData.append("first_name", payload.first_name ?? "");
  formData.append("last_name", payload.last_name ?? "");
  formData.append("promo_code", payload.promo_code);
  formData.append("promo_URL", payload.promo_URL);

  const response = await authenticatedFormPost<CreatePromoterResponse>(
    CREATE_PROMOTER_PATH,
    formData,
  );

  if (response.status !== 200) {
    throw new Error(response.message || "Failed to create promoter.");
  }

  return response;
}

export async function updatePromoter(
  payload: UpdatePromoterPayload
): Promise<UpdatePromoterResponse> {
  const response = await authenticatedPost<UpdatePromoterResponse>(
    UPDATE_PROMOTER_PATH,
    payload,
  );

  if (response.status !== 200) {
    throw new Error("Failed to update promoter.");
  }

  return response;
}

export async function resetPromoterPassword(
  payload: ResetPromoterPasswordPayload,
): Promise<ResetPromoterPasswordResponse> {
  const normalizedUserId =
    typeof payload.user_id === "string" && /^\d+$/.test(payload.user_id)
      ? Number(payload.user_id)
      : payload.user_id;

  const response = await authenticatedPost<ResetPromoterPasswordResponse>(
    RESET_PROMOTER_PASSWORD_PATH,
    {
      user_id: normalizedUserId,
    },
  );

  if (typeof response.status === "number" && response.status !== 200) {
    throw new Error(response.message || "Failed to reset password.");
  }

  return response;
}
