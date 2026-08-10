# Promotion Scheduling Backend Handoff

## Business Rule

Promotions are day-based. At any point in time, only one promotion may be truly active.

`is_active = 1` must only mean the promotion is currently live. Future scheduled promotions must not use `is_active = 1`.

## Status And `is_active`

Use these meanings consistently:

| Promotion state | `status` | `is_active` | Meaning |
| --- | --- | --- | --- |
| Draft / scheduled reservation | `draft` or backend scheduled equivalent | `0` | Has dates, can become active later, but is not live now. |
| Active | `active` | `1` | The only currently live promotion. |
| Inactive | `inactive` | `0` | Does not reserve an active window. |
| Expired | `expired` | `0` | Ended, not live, does not reserve a future window. |

Do not return `is_active = 1` for future scheduled promotions.

## Date Overlap Rule

The frontend validates that promotion date windows do not overlap, except for inactive/expired promotions.

Two windows overlap when:

```text
promotion_a.start_date <= promotion_b.end_date
AND
promotion_a.end_date >= promotion_b.start_date
```

Because promotions are day-based, same-day boundaries count as overlap. For example:

```text
Promotion A: Aug 3 - Aug 8
Promotion B: Aug 8 - Aug 12
```

This overlaps because Aug 8 belongs to both promotions.

## Frontend Validation Already In Place

Before create/update, the frontend checks:

- Promotion name is required.
- Start date is required.
- End date is required.
- End date must be after start date.
- The proposed promotion window must not overlap any other promotion window unless the other promotion is inactive or expired.
- When editing, the promotion is not compared against itself.

The frontend sends new promotions as:

```text
status = draft
is_active = 0
```

The frontend sends active edits as:

```text
status = active
is_active = 1
```

For non-active statuses, the frontend sends:

```text
is_active = 0
```

## Backend Requirements

Backend should enforce the same date-overlap rule before creating or updating promotions. Frontend validation is for UX only; backend must be the source of truth.

Backend should reject create/update when the proposed date window overlaps another non-inactive/non-expired promotion.

Backend should reject setting any promotion active if another promotion is already active.

Backend should ensure the active promotion has:

```text
status = active
is_active = 1
```

Backend should ensure all non-active promotions have:

```text
is_active = 0
```

## Scheduled Activation

Use a backend cron/scheduled job as the primary activation mechanism.

Recommended daily flow:

1. Find active promotions whose `end_date` is before today and mark them expired/inactive with `is_active = 0`.
2. Find the promotion whose date range includes today and is eligible to become active.
3. Before activating, verify no other promotion is active.
4. Verify the promotion does not overlap any other non-inactive/non-expired promotion in a way that would create two active windows.
5. Set only that promotion to:

```text
status = active
is_active = 1
```

6. Log the activation action.

Optional fallback: API reads can call a lightweight sync function, but request-time sync should not be the main activation method.

## Important Edge Cases

- A future scheduled promotion must not have `is_active = 1`.
- Extending a current promotion must be blocked if it overlaps a future reserved promotion.
- Moving a future promotion earlier must be blocked if it overlaps the current active promotion.
- Inactive and expired promotions can overlap because they do not reserve windows.
- Draft/scheduled reservations should still be checked for date overlap so the cron cannot later create two active promotions.
- Backend must protect against two admins saving overlapping promotions at the same time.
