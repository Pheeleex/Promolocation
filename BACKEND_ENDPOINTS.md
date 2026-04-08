# Backend Endpoints Needed For Current Frontend

This file lists only the backend endpoints and parameters required to replace the app's current hardcoded data.

I did not add new backend requirements that are not already implied by the current frontend.

Examples of things intentionally not added here:
- token refresh
- role/permission fields
- server-side search, sorting, or pagination
- image upload endpoints
- extra promoter profile fields
- extra incident metadata

Those can be added later, but only with explicit approval because they go beyond the current hardcoded contract.

## Current frontend data shapes

### Auth user
Used today:

```json
{
  "id": "12345"
}
```

### Promoter
Used today:

```json
{
  "userId": "12345",
  "status": "Active"
}
```

Current status values already present in hardcoded data:
- `Active`
- `Inactive`
- `Pending`

### Incident
Used today:

```json
{
  "userId": "PRM001",
  "image": "assets/test1.png",
  "issue": "Late Arrival",
  "description": "Arrived 2 hours late to assigned promotional duty.",
  "date": "2026-02-10",
  "status": "Pending"
}
```

Current incident status values already present in hardcoded data:
- `Pending`
- `In Progress`
- `Resolved`
- `Closed`

## Required endpoints

### 1. Log in

`POST /auth/login`

Purpose:
- Replace the current hardcoded `dummyUsers` login check.

Request body:

```json
{
  "userId": "12345",
  "password": "password"
}
```

Required request parameters:
- `userId`: string
- `password`: string

Minimum response body needed by current frontend:

```json
{
  "id": "12345"
}
```

Required response parameters:
- `id`: string

Notes:
- The current frontend only stores `id` after login.
- No token or refresh contract is documented here because that is not currently hardcoded.

### 2. Get promoters list

`GET /promoters`

Purpose:
- Populate the promoters table.
- Provide the data used by client-side search, sorting, and pagination.

Query parameters required today:
- None

Minimum response body needed by current frontend:

```json
[
  {
    "userId": "12345",
    "status": "Active"
  }
]
```

Required response parameters per item:
- `userId`: string
- `status`: string

Notes:
- The current frontend handles search, sorting, and pagination on the client, so no backend query params are required for parity.
- `userId` should be unique because the add-promoter screen already treats duplicates as invalid.

### 3. Create promoter

`POST /promoters`

Purpose:
- Replace the current local add-promoter flow.

Request body:

```json
{
  "userId": "12380",
  "status": "Active"
}
```

Required request parameters:
- `userId`: string
- `status`: string

Minimum response body needed by current frontend:

```json
{
  "userId": "12380",
  "status": "Active"
}
```

Required response parameters:
- `userId`: string
- `status`: string

Notes:
- The current add form only creates `userId` and `status`.
- No extra profile fields are required by the current UI.

### 4. Update promoter status

`PATCH /promoters/:userId`

Purpose:
- Replace the current edit-promoter modal behavior.

Path parameters:
- `userId`: string

Request body:

```json
{
  "status": "Inactive"
}
```

Required request parameters:
- `status`: string

Minimum response body needed by current frontend:

```json
{
  "userId": "12345",
  "status": "Inactive"
}
```

Required response parameters:
- `userId`: string
- `status`: string

Notes:
- The current edit UI only changes `status`.
- It does not edit `userId`.

### 5. Get incidents list

`GET /incidents`

Purpose:
- Populate the incident history table.
- Provide all fields currently used by the incident detail page.

Query parameters required today:
- None

Minimum response body needed by current frontend:

```json
[
  {
    "userId": "PRM001",
    "image": "assets/test1.png",
    "issue": "Late Arrival",
    "description": "Arrived 2 hours late to assigned promotional duty.",
    "date": "2026-02-10",
    "status": "Pending"
  }
]
```

Required response parameters per item:
- `userId`: string
- `image`: string
- `issue`: string
- `description`: string
- `date`: string
- `status`: string

Notes:
- `image` is currently consumed directly as an image source string.
- `date` is currently hardcoded as a string like `2026-02-10`.
- A separate incident-detail fetch is not required for parity because the current frontend already expects the list data to contain the full detail fields.

### 7. Update incident status

`PATCH /incidents/:userId`

Purpose:
- Replace the current "Mark as Resolved" flow on the incident detail page.

Path parameters:
- `userId`: string

Request body:

```json
{
  "status": "Resolved"
}
```

Required request parameters:
- `status`: string

Minimum response body needed by current frontend:

```json
{
  "userId": "PRM001",
  "image": "assets/test1.png",
  "issue": "Late Arrival",
  "description": "Arrived 2 hours late to assigned promotional duty.",
  "date": "2026-02-10",
  "status": "Resolved"
}
```

Required response parameters:
- `userId`: string
- `image`: string
- `issue`: string
- `description`: string
- `date`: string
- `status`: string

Notes:
- The current frontend only updates incident `status`.
- The current action specifically sets the status to `Resolved`.

## Endpoints not required for current parity

These are not required to replace the current hardcoded data:
- `POST /auth/logout`
- `GET /incidents/:userId`
- server-side search endpoints
- server-side pagination parameters
- promoter profile endpoints with fields beyond `userId` and `status`
- incident create/edit/upload endpoints

If you want any of those added to this contract, I will ask permission first and explain why they would be useful.

## Frontend source this contract was derived from

- `src/pages/LoginPage.jsx`
- `src/pages/PromotersPage.jsx`
- `src/pages/AddPromoterPage.jsx`
- `src/pages/IncidentHistoryPage.jsx`
- `src/pages/IncidentDetailPage.jsx`
- `src/data/seed.js`
