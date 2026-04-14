# Backend Handoff: Admin Auth, Incident Audit Trail, and Email Notifications

Hi,

Here is the backend handoff for the next round of work. This is based on the current frontend implementation and the changes we are now making.

The main items are:

1. We are moving admin dashboard login from code-based login to email-based login.
2. We need a proper backend-driven audit trail for incidents.
3. We need email notifications around incident creation and updates.

I have written this to be practical from frontend side: expected APIs, fields we send, fields we need back, validations, and restrictions.

## 1. Roles and Access Rules

For the admin dashboard, these are the roles in scope:

- `admin`
- `specialadmin`

Important access rules:

- Only `admin` and `specialadmin` should be able to log into the admin dashboard.
- `specialadmin` can raise/report incidents.
- `admin` manages promoters.
- Both `admin` and `specialadmin` can view incidents.
- Incident status transitions must still be enforced on the backend, not only on the frontend.

## 2. Admin Authentication Change: Login by Email

We are moving away from login by code/promoter ID. Both `admin` and `specialadmin` should now log in with:

- `email`
- `password`

Backend has now confirmed that admin authentication uses the `admin_api` namespace.

### 2.1 Expected Login API

**Endpoint**

`POST /admin_api/admin_login`

**Request body**

```json
{
  "token": "API_TOKEN",
  "email": "admin@example.com",
  "password": "user_password"
}
```

**Validations / restrictions**

- Email is required.
- Password is required.
- Email should be trimmed and normalized to lowercase before lookup.
- Only `admin` and `specialadmin` should be allowed through this dashboard login flow.
- If the user is not one of those roles, return a blocked response.
- If the account is inactive, block login.
- If email verification is required on your side, block login until verified.

**Expected success response**

Please keep the success response shape as close as possible to what frontend already uses:

```json
{
  "status": 200,
  "message": "Login successful.",
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user_id": 17,
  "promoter_id": "PROMO001",
  "email": "admin@example.com",
  "fullname": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "08000000000",
  "user_role": "admin",
  "avatar": "avatar.jpg",
  "active": true,
  "email_verified": true,
  "is_resolved": true
}
```

**Notes**

- Even though login is moving to email, please still return `promoter_id` for now because the current frontend auth store still keeps it.
- `user_role` should remain one of `admin` or `specialadmin`.

**Error statuses already handled on frontend**

- `400` -> invalid credentials
- `401` -> invalid API token
- `403` -> email not verified
- `404` -> account not found
- `406` -> account pending approval
- `423` -> account deactivated
- `451` -> user is not allowed to use the admin dashboard

## 3. Password Management

We now need both of these:

1. Authenticated password change/reset for logged-in admins
2. Forgot-password flow for admins who cannot log in

### 3.1 Authenticated Change Password

**Endpoint**

`POST /admin_api/change_password`

**Request**

Header:

- `Authorization: Bearer <access_token>`

Body:

```json
{
  "token": "API_TOKEN",
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}
```

**Expected response**

```json
{
  "status": 200,
  "message": "Password changed successfully.",
  "changed_at": "2026-04-13T10:30:00Z"
}
```

**Restrictions / validations**

- Only logged-in `admin` and `specialadmin` should be able to use this.
- `current_password` must be correct.
- `new_password` and `confirm_password` must match.
- New password should not be the same as the old password.
- Please invalidate or rotate old sessions/tokens after a successful password change if that fits your auth model.
- Basic minimum validation should be enforced server-side as well.

### 3.2 Forgot Password

**Endpoint**

`POST /admin_api/forgot_password`

**Request body**

```json
{
  "token": "API_TOKEN",
  "email": "admin@example.com"
}
```

**Expected response**

Please keep this generic so we do not expose whether an email exists:

```json
{
  "status": 200,
  "message": "If an account exists for that email, a reset instruction has been sent."
}
```

**Restrictions / validations**

- Do not reveal whether the email exists.
- Only allow this flow for `admin` and `specialadmin` accounts.
- Rate-limit this endpoint.
- Reset token/code should expire.
- Reset token/code should be single-use.
- If multiple requests are made, older reset tokens should be invalidated.
- Backend confirmed the forgot-password response should always be `200` even if the email does not exist.
- Current backend rule is `1 request per 5 minutes per account`.
- Current backend rule is `24 hour` OTP expiry.

### 3.3 Reset Password from Forgot Password Flow

**Endpoint**

`POST /admin_api/reset_admin_password`

**Request body**

```json
{
  "token": "API_TOKEN",
  "email": "admin@example.com",
  "code": "047823",
  "new_password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}
```

**Expected response**

```json
{
  "status": 200,
  "message": "Password reset successfully."
}
```

**Restrictions / validations**

- `code` must be valid and not expired.
- `new_password` and `confirm_password` must match.
- Reset code must be invalidated immediately after success.
- Please invalidate old sessions/tokens after password reset.

## 4. Authenticated Request Convention Used by Frontend

For the new admin-only endpoints under `admin_api`, the frontend now sends auth like this:

- Header: `Authorization: Bearer <access_token>`
- Body:

```json
{
  "token": "API_TOKEN",
  "...": "other_payload_fields"
}
```

Public endpoints like login and forgot password currently send only:

```json
{
  "token": "API_TOKEN",
  "...": "other_payload_fields"
}
```

The older non-admin endpoints under `/api` still use the existing request style for now. The `admin_api` routes above are the ones frontend has already adjusted for.

## 5. Incident APIs Currently in Frontend

These are the current incident-related endpoints the frontend already uses.

### 5.1 Get Incidents

**Endpoint**

`POST /get_incidents`

**Request body**

```json
{
  "token": "API_TOKEN",
  "user_id": "17"
}
```

**Expected response**

```json
{
  "status": 200,
  "message": "Incidents fetched successfully.",
  "total": 2,
  "summary": {
    "pending": 1,
    "in_progress": 0,
    "resolved": 1
  },
  "incidents": [
    {
      "incident_id": "INC001",
      "incident_name": "Late Arrival",
      "issue_category": "Attendance",
      "description": "Detailed description here",
      "status": "Pending",
      "admin_note": null,
      "created_at": "2026-04-13 10:00:00",
      "updated_at": null,
      "photo": "uploads/incidents/photo.jpg",
      "promoter_id": "PROMO001",
      "user_id": "17",
      "reporter_name": "Jane Doe",
      "reporter_email": "specialadmin@example.com",
      "reporter_phone": "08000000000"
    }
  ]
}
```

### 5.2 Create Incident

**Endpoint**

`POST /create_incident`

**Request type**

`multipart/form-data`

**Fields sent by frontend**

- `token`
- `user_id`
- `promoter_id`
- `incident_name`
- `description`
- `photo` (optional)

**Notes**

- On the main incident report page, `photo` is optional.
- If `photo` is sent, backend should still validate file type and size.
- Frontend is already validating image uploads as image-only and max `5MB`, but backend should enforce this too.

**Expected response**

```json
{
  "status": 200,
  "message": "Incident created successfully.",
  "incident": {
    "incident_id": "INC001",
    "incident_name": "Late Arrival",
    "issue_category": "Attendance",
    "description": "Detailed description here",
    "status": "Pending",
    "admin_note": null,
    "created_at": "2026-04-13 10:00:00",
    "updated_at": null,
    "photo": "uploads/incidents/photo.jpg",
    "promoter_id": "PROMO001",
    "user_id": "17",
    "reporter_name": "Jane Doe",
    "reporter_email": "specialadmin@example.com",
    "reporter_phone": "08000000000"
  }
}
```

### 5.3 Update Incident

**Endpoint**

`POST /admin_api/update_incident`

**Request body**

```json
{
  "token": "API_TOKEN",
  "incident_id": "INC001",
  "status": "Resolved",
  "comment": "Issue has been addressed."
}
```

**Expected response**

```json
{
  "status": 200,
  "message": "Incident updated successfully.",
  "incident": {
    "incident_id": "INC001",
    "status": "Resolved",
    "comment": "Issue has been addressed."
  }
}
```

## 6. Incident Workflow Rules to Enforce on Backend

Please enforce the workflow on the backend as well:

### 6.1 Who can create incidents

- `specialadmin` can create/raise incidents.
- `admin` should not be allowed to create incidents through this dashboard flow unless we explicitly add that later.

### 6.2 Allowed status transitions

**Regular admin**

- `Pending` -> `In Progress`
- `Pending` -> `Resolved`
- `In Progress` -> `In Progress`
- `In Progress` -> `Resolved`
- `Not Resolved` -> `In Progress`
- `Not Resolved` -> `Resolved`

**Special admin**

- `Resolved` -> `Not Resolved`
- `Resolved` -> `Closed`

### 6.3 Validation rules for incident updates

- `incident_id` is required.
- `status` is required.
- `comment` is optional in general.
- `comment` is required only when `status = Not Resolved`.
- `Closed` should be treated as terminal.
- If the role/status transition is not allowed, reject it on the backend.

## 7. Audit Trail Expectations

For the audit trail, please use the current frontend behavior as the expected workflow, but the final write should be backend-driven.

### 7.1 Important behavior

- Every incident action should create a new audit row.
- This starts from the moment the `specialadmin` submits the incident.
- It continues until the incident is closed.
- Audit rows should be append-only. No overwriting previous rows.

### 7.2 Preferred backend behavior

My preference is:

- backend automatically writes audit rows when `create_incident` succeeds
- backend automatically writes audit rows when `update_incident` succeeds

That is better than making frontend call a separate write endpoint for audit rows.

### 7.3 Audit row fields

Minimum fields I need backend to store and return:

- `audit_id`
- `incident_id`
- `user_id`
- `incident_title`
- `action`
- `comment` (nullable)
- `date_time`

Even though the frontend table currently shows `User ID`, `Action`, `Comment`, and `Date & Time`, I still want `incident_title` and `incident_id` in the backend record for traceability and matching.

### 7.4 Example actions from current frontend logic

- `Special Admin submitted incident`
- `Admin updated status to In Progress`
- `Admin updated status to Resolved`
- `Special Admin updated status to Not Resolved`
- `Special Admin updated status to Closed`

### 7.5 Comment behavior

- `comment` should be saved as `null` when no comment is provided.
- When the action is `Not Resolved`, `comment` is required.
- For submission rows, comment can be `null`.

### 7.6 Read API for audit trail

**Preferred endpoint**

`POST /admin_api/get_incident_audit_trail`

**Request body**

```json
{
  "token": "API_TOKEN",
  "incident_id": "INC001"
}
```

Header:

- `Authorization: Bearer <access_token>`

**Expected response**

```json
{
  "status": 200,
  "message": "Audit trail fetched successfully.",
  "audit_trail": [
    {
      "audit_id": "AUD003",
      "incident_id": "INC001",
      "user_id": "8",
      "incident_title": "Late Arrival",
      "action": "Admin updated status to Resolved",
      "comment": "Issue has been addressed.",
      "date_time": "2026-04-13T13:20:00Z"
    },
    {
      "audit_id": "AUD002",
      "incident_id": "INC001",
      "user_id": "8",
      "incident_title": "Late Arrival",
      "action": "Admin updated status to In Progress",
      "comment": null,
      "date_time": "2026-04-13T12:20:00Z"
    },
    {
      "audit_id": "AUD001",
      "incident_id": "INC001",
      "user_id": "17",
      "incident_title": "Late Arrival",
      "action": "Special Admin submitted incident",
      "comment": null,
      "date_time": "2026-04-13T10:00:00Z"
    }
  ]
}
```

**Sort order**

- Newest first is preferred.

## 8. Email Notification Rules

We need backend email notifications for incident events.

Please treat the following as the minimum notification behavior needed now.

### 8.1 When a special admin raises an incident

**Recipients**

- Active normal admin user(s)
- The special admin who raised it

**Expected email intent**

- To normal admin:
  - something like: `An incident report needs your attention urgently.`
- To special admin:
  - something like: `The incident you raised has been submitted.`

### 8.2 When a normal admin updates an incident

**Recipients**

- The special admin who raised the incident

**Expected email intent**

- something like: `Your incident has been updated.`

**Important**

- The acting normal admin does **not** need an email here.
- This is intentional so we save resources.

### 8.3 Suggested notification payload fields

For email templates, these fields would be useful:

- `incident_id`
- `incident_title`
- `current_status`
- `comment`
- `actor_name`
- `actor_role`
- `recipient_name`
- `created_at`
- `updated_at`

### 8.4 Scope note

The mandatory email cases for now are:

1. incident submitted by special admin
2. incident updated by normal admin

If later we decide to also email normal admins when a special admin marks an incident as `Not Resolved`, we can add that, but I am not treating it as required in this current scope.

## 9. Basic Backend Validations and Restrictions

Please enforce these server-side even if frontend also validates them:

### Auth

- email required for login
- password required for login
- only `admin` and `specialadmin` allowed for dashboard auth
- rate-limit login attempts
- rate-limit forgot-password requests
- generic forgot-password success response to avoid email enumeration
- `admin_api` protected routes should require a valid Bearer token

### Passwords

- password confirmation must match
- reset token must expire
- reset token must be single-use
- new password should not match old password
- old sessions/tokens should be invalidated after password change/reset if possible

### Incident creation

- `user_id` required
- `promoter_id` required
- `incident_name` required
- `description` required
- `photo` optional
- if `photo` is sent, it must be an image
- if `photo` is sent, max size should be `5MB`

### Incident update

- `incident_id` required
- `status` required
- allowed transitions must be enforced
- `comment` optional for general updates
- `comment` required only for `Not Resolved`

### Audit trail

- audit rows should be immutable
- every successful incident action should append a row
- no audit row should be silently replaced

## 10. Final Notes

- Please keep status values normalized exactly as:
  - `Pending`
  - `In Progress`
  - `Resolved`
  - `Not Resolved`
  - `Closed`
- Please keep timestamps consistent. ISO 8601 is preferred.
- If any of the endpoint names need to change on backend, that is fine, but please let me know early so frontend can align before wiring the new flows.

Thanks.
