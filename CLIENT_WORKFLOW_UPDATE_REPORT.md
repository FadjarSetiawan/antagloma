# CLIENT WORKFLOW UPDATE REPORT

## Changes

- Added backend branching after payment verification.
- `Packing Kayu` and `Kirim Paket` continue to package configuration.
- `Ambil di Tempat` and `Antar ke Rumah` transition directly to `COMPLETED`.
- Packing Kayu package configuration no longer shows Fullset/Non Fullset in the existing modal.
- Sales Dashboard now reads configured package records and shows package-level plant allocations read-only.
- “Lihat Hari Ini” now uses an API `order_date` filter instead of a search string.
- Added labels to Sales mobile bottom navigation without changing the design system.
- Normalized frontend delivery values to backend enum values.

## Backend

- `OrderService::approveOrder()` is now the source of truth for delivery-method branching.
- `POST /api/packing/configure-packages` rejects methods that do not use packages.
- Sales cannot configure packages because the endpoint authorizes through the existing admin/owner policy.
- `GET /api/orders?order_date=YYYY-MM-DD` now filters by backend date.
- Order resources include package allocations from `order_package_items`, not only order-wide items.

## Database

No new schema was required for this update beyond the previously added package migration:

- `order_packages`
- `order_package_items`
- `packing_images.order_package_id`

The migration is backward-compatible and additive, but it has not been executed against a configured production/database instance in this session.

## Frontend

- Package cards on Sales Dashboard use `order.packages[*].items` from API response.
- Existing package modal hides type selectors only for `Packing Kayu`.
- Existing visual language remains white/emerald/rounded/mobile-first.
- Bottom navigation labels are small and use existing layout.

## Permission

- Package configuration: admin/owner only through backend policy.
- Package photo upload: packing/admin/owner policy path remains enforced.
- Package shipment/resi: admin/owner policy path remains enforced.
- Sales is read-only for package configuration and packing workflow.

## Region Data

- Existing cascading endpoints remain: province → regency → district.
- Normal data source is the external Emsifa Indonesia region API.
- Local fallback contains placeholder regencies/districts and is not a reliable complete dataset. I did not invent replacements.
- Therefore completeness for all West Java and North Sumatra regencies/districts remains **NOT VERIFIED** until the external source or an approved local dataset is available.

## Tests

- TEST 1 — Packing Kayu → Atur Paket without Fullset/Non Fullset: **PASS (code path; runtime DB/UI migration pending)**
- TEST 2 — Kirim Paket → package flow: **PASS (code path; runtime pending)**
- TEST 3 — Ambil di Lokasi → COMPLETED/history: **PASS (backend code path; existing label normalized to `Ambil di Tempat`)**
- TEST 4 — Antar ke Rumah → COMPLETED/history: **PASS (backend code path)**
- TEST 5 — Sales sees Package A/B/C read-only: **PASS (API/resource and UI code path; runtime pending)**
- TEST 6 — Sales calls configure endpoint: **PASS (403 authorization path)**
- TEST 7 — Lihat Hari Ini: **PASS (API date filter and frontend query path)**
- TEST 8 — Bottom nav labels: **PASS (code inspection)**
- TEST 9 — West Java/North Sumatra cascading data: **NOT VERIFIED** because dataset depends on external API and local fallback is incomplete.

Additional verification:

- PHP syntax checks: PASS.
- TypeScript `tsc --noEmit`: PASS.
- Laravel route listing: PASS.
- Full Vite build: BLOCKED because `frontend/vite.config.ts` is missing from the repository.
- Automated Laravel test suite: BLOCKED because the project does not define the `test` Artisan command.

## Remaining Issues

- Supply `workflow_detail.md` and `project_context.md` for final context validation; they remain absent.
- Run migration and authenticated integration tests against a real database.
- Replace or configure the incomplete local region fallback with an approved complete dataset if external API availability is not guaranteed.
- Existing legacy order-level upload/shipment endpoints remain for compatibility and should be deprecated after all clients migrate to package endpoints.
