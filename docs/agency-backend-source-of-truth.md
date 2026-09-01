# Agency Source Of Truth

This document is the shared frontend/backend contract for agency scoping across admins, promoters, promotions, QR codes, and promotion assignments.

## Core Principle

Agency sits above promoters and promotions.

```text
Agency
  -> Promoters
  -> Promotions
  -> Promotion assignments / promoter-brand QR rows
```

Brands are universal and must not be agency-scoped.

An admin with one agency should only see and manage records for that agency. An admin with `agency = all` can see and manage all agency records.

## Agency Values

Backend should return an `agency` value for admin users after login.

Examples:

```json
{
  "user_role": "admin",
  "agency": "Zipline"
}
```

```json
{
  "user_role": "admin",
  "agency": "all"
}
```

Rules:

- `agency = all` means cross-agency admin access.
- Any other agency value means the admin is scoped to that agency only.
- Agency names should be stable, exact values from backend setup.
- Backend should normalize casing consistently. Recommended: store/display canonical names such as `Zipline`, `Skyline`, and reserve lowercase `all` for all-agency access.

## Admin Access Rules

Agency-scoped admins can:

- View only promoters in their agency.
- Create promoters only in their agency.
- View only promotions in their agency.
- Create promotions only in their agency.
- Manage assignments only for promotions in their agency.
- View QR codes related to their agency.

All-agency admins can:

- View promoters across agencies.
- Create promoters after selecting an agency.
- View promotions across agencies.
- Create promotions after selecting an agency.
- Manage assignments for any agency promotion.
- View QR codes across agencies.

Backend must enforce this. Frontend filtering is only for user experience.

## Login Response

Admin login should include agency.

Endpoint:

```text
POST /uat/admin_api/admin_login
```

Recommended response shape:

```json
{
  "status": 200,
  "message": "Login successful",
  "access_token": "JWT",
  "user_id": 165,
  "email": "admin@example.com",
  "user_role": "admin",
  "agency": "Zipline"
}
```

If backend does not include agency, frontend currently simulates it temporarily. Once backend returns `agency`, frontend should use backend agency as source of truth.

## Agency List

Frontend needs a way to populate agency dropdowns for all-agency admins.

Recommended endpoint:

```text
POST /api/get_agencies
```

Suggested request:

```json
{
  "token": "API_TOKEN",
  "jwt": "JWT"
}
```

Suggested response:

```json
{
  "status": 200,
  "message": "Agencies retrieved successfully",
  "agencies": [
    {
      "id": 1,
      "name": "Zipline",
      "is_active": 1
    },
    {
      "id": 2,
      "name": "Skyline",
      "is_active": 1
    }
  ]
}
```

Only active agencies should be selectable for new promoters and promotions.

## Promoters

Promoters belong to one agency.

Backend should add agency to promoter records.

Recommended raw promoter fields:

```json
{
  "id": "101",
  "promoter_id": "PR123",
  "promo_code": "PR123",
  "user_role": "user",
  "agency": "Zipline"
}
```

### Listing Promoters

Endpoint:

```text
POST /api/get_users
```

Rules:

- Agency-scoped admin should receive only promoters in their agency.
- `agency = all` admin may receive all promoters.
- Response should include `agency` on each promoter.

Optional backend-supported filters:

```json
{
  "agency": "Zipline"
}
```

Frontend can use this later for server-side filtering, but backend should still infer scope from JWT and prevent unauthorized cross-agency access.

### Creating Promoters

Endpoint:

```text
POST /api/create_promoter
```

Rules:

- If admin has one agency, backend should automatically assign the promoter to that admin agency.
- If admin has `agency = all`, request must include selected `agency`.
- Backend should reject missing or invalid agency when required.
- Backend should reject an agency-scoped admin attempting to create a promoter under a different agency.

Suggested all-agency admin request:

```text
token       = API_TOKEN
jwt         = JWT
promoter_id = PR123
promo_code  = PR123
agency      = Zipline
```

For a scoped admin, frontend may omit `agency`; backend should use JWT agency.

## Promotions

Promotions belong to one agency.

Backend should add agency to promotion records.

Recommended promotion fields:

```json
{
  "id": "15",
  "name": "Summer Promo",
  "promotion_code": "587730",
  "agency": "Zipline",
  "start_date": "2026-08-15 00:00:00",
  "end_date": "2026-08-19 23:59:59",
  "status": "scheduled",
  "is_active": "0"
}
```

### One Active Promotion Per Agency

The active-promotion rule is per agency, not global.

Allowed:

```text
Zipline active promotion: 1 Aug 2026 - 10 Aug 2026
Skyline active promotion: 1 Aug 2026 - 10 Aug 2026
```

Blocked:

```text
Zipline active promotion: 1 Aug 2026 - 10 Aug 2026
Zipline scheduled promotion: 5 Aug 2026 - 12 Aug 2026
```

### Promotion Date Overlap

Date overlap should only be checked against promotions in the same agency.

Only `active` and `scheduled` promotions reserve date windows.

Overlap formula:

```text
promotion_a.agency = promotion_b.agency
AND promotion_a.start_date <= promotion_b.end_date
AND promotion_a.end_date >= promotion_b.start_date
```

Same-day boundaries count as overlap.

Inactive and expired promotions do not block date windows.

### Creating Promotions

Endpoint:

```text
POST /api/manage_promotions
```

Create request should include agency only when admin has `agency = all`.

Suggested all-agency admin request:

```text
token         = API_TOKEN
jwt           = JWT
function_type = create
name          = Summer Promo
description   = ...
start_date    = 2026-09-01 00:00:00
end_date      = 2026-09-10 23:59:59
agency        = Zipline
```

Rules:

- Scoped admin creates promotion under their JWT agency.
- All-agency admin must provide agency.
- Backend derives status from date.
- Backend validates overlaps only inside that agency.
- Backend rejects cross-agency create attempts by scoped admins.

### Listing Promotions

Rules:

- Scoped admin receives only promotions in their agency.
- `agency = all` admin can receive all promotions.
- Response should include `agency` for every promotion.

### Updating Promotions

Rules:

- Scoped admin can update only promotions in their agency.
- `agency = all` admin can update any promotion.
- Changing agency on an existing promotion should be restricted or carefully validated because assignments and QR codes inherit agency through the promotion.
- If backend allows changing promotion agency, it must validate:
  - new agency exists
  - date overlaps in the new agency
  - existing assigned promoters all belong to the new agency, or assignments are migrated/invalidated safely

Recommendation: do not allow promotion agency changes after assignments exist.

## Promotion Assignments

Promotion assignments inherit agency from the promotion.

Do not require agency in the Excel workbook.

Workbook rows should remain:

```text
promotion_code,promoter_code,brand,qr code
```

Agency is resolved through:

```text
promotion_code -> promotion -> agency
```

### Importing Assignments

Endpoint:

```text
POST /api/import_brands_category
```

Rules:

- Backend should find the promotion by `promotion_code`.
- Backend should verify the admin can manage that promotion agency.
- Backend should verify each `promoter_code` belongs to the same agency as the promotion.
- Backend should verify brand exists globally.
- Backend should reject promoter-brand duplicates within the same promotion.
- Backend should reject assignment into inactive or expired promotions if management is not allowed.

Important:

```text
Same promoter + same brand + same promotion = duplicate
Same promoter + different brand + same promotion = allowed
Same promoter + same brand + different promotion = allowed if valid for that promotion agency
```

### Single Assignment Create

Endpoint:

```text
POST /api/create_promoter_brand
```

Rules:

- If `promotion_code` is provided, backend should validate promotion exists and is manageable.
- Backend should validate admin has access to that promotion agency.
- Backend should validate promoter belongs to the same agency as promotion.
- Backend should validate brand exists globally.
- Backend should reject duplicate promoter-brand rows for the same promotion.

Suggested request:

```text
token          = API_TOKEN
jwt            = JWT
promoter_id    = PR123
brand          = Luckystrike
promotion_code = 587730
promo_type     = Summer Promo
promo_URL      = file
```

### Assignment Update

Endpoint:

```text
POST /api/manage_promoter_brand
```

Rules:

- Updating an assignment must preserve agency consistency.
- If promoter changes, new promoter must belong to the promotion agency.
- If promotion changes, new promotion must be manageable and same-agency rules must pass.
- If brand changes, brand must exist globally.

## QR Codes

QR codes inherit agency from the promotion when attached to promotion uploads or assignments.

### Bulk QR Upload

Endpoint:

```text
POST /api/upload_qr_codes_bulk
```

Request should include:

```text
token
jwt
promotion_code
file
```

Rules:

- Backend should find promotion by `promotion_code`.
- Backend should verify admin can manage that promotion agency.
- Uploaded QR files belong to that promotion agency.
- Duplicate validation should be scoped to the promotion unless backend intentionally enforces global QR uniqueness.

### QR Repository

Endpoint:

```text
POST /api/get_qr_codes
```

Rules:

- Scoped admin should receive only QR codes related to their agency.
- `agency = all` admin can receive QR codes across agencies.
- Response should include agency directly or include enough promotion/promoter data for frontend to identify agency.

Recommended response field:

```json
{
  "filename": "587730_ABC12.png",
  "promotion_code": "587730",
  "promoter_id": "PR123",
  "brand": "Luckystrike",
  "agency": "Zipline"
}
```

## Brands

Brands are universal.

Rules:

- Brand setup/listing is not agency-scoped.
- All admins who can manage brands see the same brand list.
- Assignment validation should match brand names exactly against the universal brand list.

## Security Requirements

Backend must never rely only on frontend filtering.

Every protected endpoint should derive admin agency from JWT/session and enforce:

- Scoped admins cannot read records outside their agency.
- Scoped admins cannot create records in another agency.
- Scoped admins cannot update/delete records in another agency.
- All-agency admins must explicitly provide agency when creating agency-owned records.
- Brands remain global.

## Frontend Simulation

Frontend currently simulates agency until backend supports it.

Simulation behavior:

- Login user is enriched with an agency locally.
- Created promoters and promotions store agency in localStorage.
- Existing backend records get stable simulated agency fallback.
- Assignment validation uses the selected promotion agency.
- QR repository and lists are filtered by simulated agency.

This simulation should be removed or minimized once backend returns real agency fields.

## Backend Implementation Checklist

- Add `agency` to admin login response.
- Add agency setup/list endpoint.
- Add `agency` to promoter records and responses.
- Add `agency` to promotion records and responses.
- Scope `get_users` by admin agency.
- Scope `manage_promotions` list/get/create/update by admin agency.
- Enforce one active promotion per agency.
- Enforce date overlap only within same agency.
- Validate assignment promoter agency matches promotion agency.
- Scope QR uploads by promotion agency.
- Scope QR repository by admin agency.
- Keep brands universal.
- Return clear validation messages for agency violations.

