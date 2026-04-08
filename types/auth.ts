// src/types/auth.ts
export type LoginPayload = {
  token: string;
  promoter_id: string;
  password: string;
};

export type LoginResponse = {
  status: number;
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user_id: number;
  promoter_id: string;
  email: string;
  fullname: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_role: string;
  avatar: string;
  active: boolean;
  email_verified: boolean;
  is_resolved: boolean;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
