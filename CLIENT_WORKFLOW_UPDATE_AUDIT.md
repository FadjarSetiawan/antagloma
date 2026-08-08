# CLIENT WORKFLOW UPDATE — AUDIT

| Requirement | Current implementation | Result | Minimal fix |
|---|---|---|---|
| Verify branching by delivery method | `OrderService::approveOrder()` always sets `WAITING_PACKING` | FAIL | Backend sets `COMPLETED` for pickup/home; only packing/kirim enter package workflow |
| Packing Kayu package UI | Existing modal always renders Fullset/Non-fullset selector | FAIL | Hide selector and omit package type for Packing Kayu |
| Kirim Paket package workflow | Package persistence endpoint exists, but order branch is not enforced | FAIL | Backend validates delivery method and keeps package flow |
| Ambil di Lokasi | Backend enum is `Ambil di Tempat`; frontend sends `Ambil Di Lokasi`; approve still packing | FAIL | Normalize accepted values and complete on verification |
| Antar ke Rumah | Approve still packing | FAIL | Complete on verification |
| Sales package read-only | Orders can include packages, but Sales dashboard renders order-level cards | FAIL | Render package summaries from API; configure endpoint remains policy-authorized |
| Sales configure authorization | `configurePackages()` uses `approve` policy (admin/owner only) | PASS | Keep backend enforcement |
| Today list | Button sends `search=today`; API has no date filter | FAIL | Add `order_date` query filter and use it from UI |
| Bottom labels | Mobile nav renders icons only in primary slots | FAIL | Add small labels without layout redesign |
| Region data | Normal path calls external Emsifa API; local fallback uses placeholders (`KABUPATEN BARAT`, etc.) | RISK | Do not invent names; report fallback as incomplete. External dataset cannot be verified offline |

The requested `workflow_detail.md` and `project_context.md` are still absent from the repository. The latest client requirements therefore take precedence for this update.
