# WORKFLOW FIX REPORT

## 1. Issues Found

- Source files `workflow_detail.md` and `project_context.md` are absent.
- Order status was the only persisted state; package A/B/C had no backend entity.
- Print status was local React state and nota/label were not independent backend flags.
- Packing photos were order-level, so one photo transitioned the whole order.
- Tracking number/shipping cost/completion were order-level.
- Queue used newest-first ordering.
- Configure/upload/package mutations were not consistently represented by backend authorization and package IDs.
- Public migration helper route was unauthenticated.
- Frontend upload URL did not match the declared API route.

## 2. Root Cause

The original design modeled the operational workflow as an order state machine, while the client workflow is a package state machine with an order-level aggregate. The UI had package-shaped cards, but the database/API did not persist the same identity or transitions.

## 3. Changes Made

- Added `order_packages` and `order_package_items` persistence.
- Added per-package nota/label flags and timestamps, waiting-photo timestamp, photo timestamp, tracking number, shipping cost, and completion timestamp.
- Added `order_package_id` to packing images while retaining `order_id` for compatibility.
- Added package relationships and package state projection to API order resources.
- Added backend endpoints for package configuration, print actions, package photo upload, and package shipment.
- Added transaction/row-lock behavior for package photo upload and allocation validation so allocated quantities cannot exceed order quantities.
- Changed packing queue ordering to oldest-first.
- Protected `/run-migrate` with Sanctum.
- Aligned the frontend packing configuration call with the backend endpoint and corrected the package upload path.
- Preserved the existing order-level fields and UI design; no rewrite was performed.

## 4. Workflow Verification

| Test | Result | Notes |
|---|---|---|
| 1. Create → verify → configure A/B/C | **PARTIAL** | Create/verify existing flow works; package persistence endpoint added, but live DB migration and end-to-end run were not available. |
| 2. Print nota only remains unprinted | **PASS (code path)** | Package status requires both flags; endpoint persists only nota flag. |
| 3. Print label then printed | **PASS (code path)** | Both flags produce `WAITING_PHOTO`; requires migration/runtime verification. |
| 4. Enter waiting photo | **PASS (code path)** | Set when both documents are printed. |
| 5. Reprint nota | **PASS (code path)** | Print endpoint is idempotent and remains available; UI wiring still needs completion. |
| 6. Upload A moves only A | **PARTIAL** | Package upload endpoint is isolated; existing packing UI does not yet expose complete package-targeted photo controls. |
| 7. Resi A only | **PASS (code path)** | Package shipment endpoint updates only target package. |
| 8. Sales configure package rejected | **PASS (authorization path)** | Configure uses the admin/owner approval policy. |
| 9. Sales upload photo rejected | **PASS (authorization path)** | Package upload uses `uploadPacking` policy. |
| 10. Sales input resi rejected | **PASS (authorization path)** | Package shipment uses `completeShipment` policy. |
| 11. Three packages count as three | **FAIL / NOT IMPLEMENTED** | Dashboard counter is still frontend/order-derived and needs a package-aware server metric. |
| 12. Partial shipment | **PASS (validation path)** | Allocation is stored per package and over-allocation is rejected; live DB verification pending. |

## 5. Database Changes

Migration `2026_08_08_000011_create_order_packages_table.php` adds:

- `order_packages`
- `order_package_items`
- nullable `packing_images.order_package_id`

The migration was syntax-checked but was not executed against a configured database in this session.

## 6. API Changes

- `POST /api/packing/configure-packages`
- `POST /api/packing/packages/{package}/print/{nota|label}`
- `POST /api/packing/packages/{package}/upload-proof`
- `POST /api/packing/packages/{package}/shipment`
- Order responses now include package state when packages are loaded.

## 7. Permission Changes

Package configuration and document printing are restricted through the existing admin/owner approval policy. Package photo upload is restricted through the existing packing/admin/owner policy. Package shipment is restricted through the existing admin/owner policy. Sales remains read-only for these operations.

## 8. Remaining Risks

- The two requested source documents are missing and must be supplied for a final source-of-truth audit.
- The configured database migration and real authenticated API scenarios were not executable here.
- Existing dashboard notification count still needs conversion to an authoritative package query.
- Existing document-printing page still maintains local print state and needs to call the new print endpoints.
- Existing packing UI still needs package-specific photo input and sales package photo/download rendering.
- `frontend/vite.config.ts` is missing, so the production Vite build cannot be verified in this workspace.
- Legacy order-level upload/shipment endpoints remain for backward compatibility and should be deprecated after clients migrate to package endpoints.
