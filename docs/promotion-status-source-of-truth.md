# Promotion Status Source Of Truth

This document is the shared frontend/backend contract for promotion statuses, date scheduling, active-state rules, and date-overlap validation.

## Core Principle

Promotions are day-based. Only one promotion can be live at any time.

`is_active = 1` must only mean the promotion is live right now. Scheduled, inactive, and expired promotions must always have `is_active = 0`.

`draft` is removed from the promotion lifecycle. Any existing promotion currently stored as `draft` should be treated as `inactive` for frontend display, backend logic, and overlap validation.

## Valid Statuses

| Status | `is_active` | Meaning | Blocks date overlap? |
| --- | --- | --- | --- |
| `active` | `1` | Promotion is live right now. | Yes |
| `scheduled` | `0` | Promotion is approved for a future date and should become active automatically. | Yes |
| `inactive` | `0` | Promotion is paused or saved but not intended to go live yet. | No |
| `expired` | `0` | Promotion has ended by date or was created as historical data. | No |

No other status should be created or returned for new data.

## Create Promotion

Frontend should not show a status field on create.

Frontend should send only:

```text
name
description
start_date
end_date
```

Backend should derive the saved status from the dates:

- If `start_date` is today and there is no active/scheduled conflict, create as `active` with `is_active = 1`.
- If `start_date` is in the future, create as `scheduled` with `is_active = 0`.
- If `end_date` is in the past, create as `expired` with `is_active = 0` for historical records.

When creating a promotion that will become `active` or `scheduled`, overlap validation must check only against existing `active` and `scheduled` promotions.

When creating a promotion that will become `expired`, overlap validation should not block it because expired promotions do not reserve active windows.

## Edit Promotion

Frontend may show status on edit.

When editing a promotion into `active` or `scheduled`, or editing the dates of an existing `active` or `scheduled` promotion, overlap validation must check only against other `active` and `scheduled` promotions.

When editing a promotion into `inactive`, overlap validation should not run.

When editing a promotion into `expired`, overlap validation should not run.

The promotion being edited must not be compared against itself.

## Date Overlap Rule

Only `active` and `scheduled` promotions reserve date windows.

Inactive, expired, and legacy draft promotions must not be considered blockers.

Two reserving promotion windows overlap when:

```text
promotion_a.start_date <= promotion_b.end_date
AND
promotion_a.end_date >= promotion_b.start_date
```

Because promotions are day-based, same-day boundaries count as overlap.

Example:

```text
Promotion A: 3 Aug 2026 - 8 Aug 2026
Promotion B: 8 Aug 2026 - 12 Aug 2026
```

These overlap because both include 8 Aug 2026.

## Frontend Validation

Frontend validation is for user experience only. Backend must still enforce every rule.

Frontend should validate:

- Promotion name is required.
- Start date is required.
- End date is required.
- End date must be after start date.
- A create/edit that resolves to `active` or `scheduled` must not overlap another `active` or `scheduled` promotion.
- A create/edit that resolves to `inactive` or `expired` should not be blocked by date overlap.
- Existing `inactive`, `expired`, or legacy `draft` promotions should be ignored during overlap checks.
- A promotion being edited should not be compared against itself.

## Backend Requirements

Backend should enforce:

- There can never be more than one `active` promotion with `is_active = 1`.
- `is_active = 1` is only valid when `status = active`.
- `scheduled`, `inactive`, and `expired` must always have `is_active = 0`.
- `draft` should not be stored for new promotions.
- Any existing `draft` promotion should be normalized or treated as `inactive`.
- Empty `status` values should not be stored. If status is missing, backend should derive or normalize it.
- Date overlaps should be checked against `active` and `scheduled` promotions only.
- `inactive`, `expired`, and legacy `draft` promotions should not block date windows.

## Scheduled Activation

Backend should use a scheduled job/cron as the main mechanism for promotion lifecycle changes.

Recommended flow:

1. Expire any active promotion whose `end_date` has passed.
2. Find scheduled promotions whose `start_date` is today.
3. Before activating, verify no other promotion is active.
4. Verify the promotion does not conflict with another `active` or `scheduled` promotion.
5. Set the eligible promotion to:

```text
status = active
is_active = 1
```

When a live promotion ends, backend should set it to:

```text
status = expired
is_active = 0
```

## UI Rules

- The Active Promotion view should show only `status = active` and `is_active = 1`.
- Promotion assignment management should be available for `active` and `scheduled` promotions only.
- `inactive`, `expired`, and legacy `draft` promotions should not be manageable.
- Create promotion should remain visible even when there is an active promotion, because users can create future scheduled promotions as long as dates do not overlap an active or scheduled promotion.

