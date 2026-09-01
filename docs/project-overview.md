# Promolocation Web Project Overview

This document describes the core behavior, feature areas, access rules, and frontend/backend contracts for the Promolocation web admin dashboard.

## Purpose

Promolocation Web is a React admin dashboard for managing promotional field operations. It lets administrators manage promoters, brands, promotions, QR code assignments, and incident workflows from a protected web interface.

The app is currently a Vite React application with a mostly JSX UI layer and TypeScript API/type modules.

## Application Stack

- React 18
- Vite
- React Router with `HashRouter`
- TanStack React Query for server state
- Zustand for persisted authentication state
- SweetAlert2 for user feedback dialogs
- `jsqr` for QR code image validation

## Main App Areas

### Authentication

Admins authenticate through the admin login endpoint. After login, the app stores the authenticated user, access token, refresh token, token type, expiry timestamp, and active state in the Zustand auth store.

Protected pages require a valid, non-expired access token. If the token is missing or expired, the app clears local auth state and redirects to login.

Auth-related pages:

- Login
- Forgot password
- Reset password
- Settings / change password

### Promoters

The promoters area lets admins view promoter users, search and sort them, inspect their assigned brands, activate or deactivate accounts, add new promoters, and request password resets.

Promoter records are expected to include identity, role, status, agency fields, and display fields such as name and promoter code. The UI filters fetched users so that only users with a promoter-like role are shown in the promoters table.

Promoter statuses are displayed as user-friendly values such as active and inactive. The backend may use lowercase values, while the UI maps and formats values for display.

### Brands

Brands are global system-level records and are not agency-scoped. Admins can list, create, update, delete, and import brand categories.

System brands may include:

- Brand name
- Brand image/logo
- Active state
- Created and updated timestamps

Promoter-brand assignments connect a promoter to a brand, optionally under a promotion, and may include a QR/promo URL upload.

### Promotions

Promotions represent scheduled or live promotional campaigns. They include:

- Promotion code
- Name
- Description
- Optional image
- Start date
- End date
- Status
- Active flag
- Agency ownership
- Promotion-brand/promoter assignments

The promotions page handles a large amount of business logic, including promotion creation/editing, local date validation, active/scheduled status handling, assignment upload templates, QR zip validation, and viewing promotion assignments.

### Active Promotion

The active promotion route is a filtered view of the promotions area. It should show only promotions where:

- `status = active`
- `is_active = 1`

Only promotions that are active or scheduled should be manageable for assignment workflows.

### QR Repository

The QR repository displays uploaded QR code records across promotions, brands, and promoters. Admins can:

- Search QR records
- Filter by promotion code
- Filter by brand
- Filter by promoter ID
- Group/order by date added, promotion, brand, or promoter

QR records are agency-scoped for viewing, even though the backend must still enforce real authorization.

### Incidents

Incident workflows let admins view incident history, inspect incident details, update incident status, view audit trail information, and create incident reports where authorized.

Incident records include:

- Incident ID
- Promoter/user identifiers
- Incident title/name
- Description
- Optional image/photo
- Date/timestamps
- Status
- Audit trail entries, where available

Incident statuses include values such as pending, in progress, resolved, and closed.

## RBAC

The app currently recognizes admin-like users through `user_role`.

### Admin Roles

The frontend treats these roles as admin roles:

- `admin`
- `specialadmin`

Any user without an admin role is redirected to login when trying to access protected routes.

### Regular Admin

A regular admin can access the main protected dashboard areas, subject to agency scope:

- Promoters list
- Add promoters
- Manage brands
- Promotions
- Active promotion
- QR repository
- Incident history
- Settings

### Special Admin

A special admin has the same admin access plus permission to access the report incident route.

The `/report_incident` route requires `specialadmin`.

### Non-Admin Users

Non-admin users are not allowed into protected dashboard routes. The default authorized path for non-admin users is login.

## Agency Rules

Agency sits above promoters and promotions:

```text
Agency
  -> Promoters
  -> Promotions
  -> Promotion assignments / promoter-brand QR rows
```

Brands are universal and must not be agency-scoped.

### Scoped Admins

An admin assigned to one agency should only view and manage records for that agency.

Scoped admins can:

- View promoters in their agency
- Create promoters in their agency
- View promotions in their agency
- Create promotions in their agency
- Manage assignments for promotions in their agency
- View QR codes related to their agency

### All-Agency Admins

An admin with all-agency access can view and manage records across agencies.

All-agency admins can:

- View promoters across agencies
- Select an agency when creating promoters
- View promotions across agencies
- Select an agency when creating promotions
- Manage assignments for any agency promotion
- View QR codes across agencies

The frontend applies agency filtering for user experience, but the backend must enforce agency authorization.

## Promotion Lifecycle Rules

Promotion status is day-based. The valid statuses are:

- `active`
- `scheduled`
- `inactive`
- `expired`

Legacy `draft` values should be treated as `inactive`.

### Active

An active promotion is live right now.

Rules:

- `status = active`
- `is_active = 1`
- Blocks overlapping active or scheduled promotions in the same agency

### Scheduled

A scheduled promotion is approved for a future date.

Rules:

- `status = scheduled`
- `is_active = 0`
- Blocks overlapping active or scheduled promotions in the same agency

### Inactive

An inactive promotion is paused or saved but not intended to go live.

Rules:

- `status = inactive`
- `is_active = 0`
- Does not block date overlap

### Expired

An expired promotion has ended or is historical.

Rules:

- `status = expired`
- `is_active = 0`
- Does not block date overlap

## Promotion Date Conflict Rules

Only active and scheduled promotions reserve date windows.

Date overlap is checked per agency, not globally. Two promotions conflict when all of the following are true:

```text
promotion_a.agency = promotion_b.agency
AND promotion_a.start_date <= promotion_b.end_date
AND promotion_a.end_date >= promotion_b.start_date
```

Same-day boundaries count as overlap.

When editing a promotion, the promotion being edited must not be compared against itself.

## Promotion Creation Rules

The create promotion flow should derive status from dates instead of requiring the admin to choose a status.

Expected backend behavior:

- Start date today creates an active promotion if there is no same-agency active/scheduled conflict.
- Future start date creates a scheduled promotion if there is no same-agency active/scheduled conflict.
- Past end date creates an expired promotion.

Frontend validation is for user experience only. Backend validation is authoritative.

## Promotion Assignment Rules

Promotion assignment workflows are available only for manageable promotions:

- Active promotions
- Scheduled promotions

Inactive, expired, and legacy draft promotions should not be manageable.

Promotion assignment imports use a Promotion Management spreadsheet template. The expected columns include:

- `promotion_code`
- `promoter_code`
- `brand`
- `qr code`

QR uploads are expected to be zip files containing valid QR image files.

## API Architecture

The frontend centralizes low-level requests in `src/api/client.ts`.

In development, `VITE_API_BASE_URL` is converted to same-origin proxy paths by Vite. This lets frontend calls use paths such as `/api/...` and `/admin_api/...` while Vite proxies requests to the configured backend origin.

Authenticated requests add:

- Static API token from `VITE_API_TOKEN`
- JWT access token from the auth store
- `Authorization: Bearer <jwt>` for admin API requests

If an authenticated request returns or throws a 401, the app clears the auth session and requires login again.

## Key Backend Endpoints Used

Auth:

- `POST /admin_api/admin_login`
- `POST /admin_api/change_password`
- `POST /admin_api/forgot_password`
- `POST /admin_api/reset_admin_password`

Promoters:

- `POST /get_users`
- `POST /create_promoter`
- `POST /update_user_role`
- `POST /admin_reset_user_password`

Agencies:

- `POST /manage_agencies` with `function_type = list`

Brands:

- `POST /get_system_brands`
- `POST /manage_brands` with `function_type = list | create | update | delete`
- `POST /import_brands_category`
- `POST /get_promoter_brands`
- `POST /create_promoter_brand`
- `POST /manage_promoter_brand` with `function_type = update | delete`

Promotions and QR:

- `POST /manage_promotions` with `function_type = list | create | update | delete`
- `POST /get_brands_by_promotion`
- `POST /upload_qr_codes_bulk`
- `POST /get_qr_codes`

Incidents:

- `POST /get_incidents`
- `POST /admin_api/update_incident`
- `POST /admin_api/get_incident_audit_trail`
- `POST /create_incident`

## Data Ownership

Backend should be treated as the source of truth for:

- Authentication
- Role authorization
- Agency authorization
- Promotion date conflicts
- Promotion active/scheduled lifecycle
- Incident status updates
- QR and assignment persistence

Frontend state and validation are for usability and responsiveness. They must not be treated as security boundaries.

## Current Implementation Notes

- The app still contains legacy local-storage seeded data through `AppDataContext`, but most active feature areas now use API hooks and React Query.
- There are both old top-level `css/` and newer `src/styles/` files. The current app imports styles from `src/styles/`.
- The promotions page contains significant business logic and would benefit from careful handling before major refactors.
- The backend contract is further documented in `docs/agency-backend-source-of-truth.md` and `docs/promotion-status-source-of-truth.md`.

