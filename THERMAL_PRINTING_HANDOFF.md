# Thermal Printing Incident Handoff

Last updated: 2026-08-14 (Asia/Jakarta)

## Purpose

This document is a focused handoff for the unresolved packing-note and shipping-label printing problems. It records the real client hardware, the current source implementation, attempts already made, latest evidence, likely causes, and a safe investigation plan.

Do not treat TypeScript/build success as proof that physical thermal output works. Final acceptance requires a real Android phone and both client printers.

## Current production context

- Repository: `FadjarSetiawan/antagloma`
- Branch: `main`
- Latest relevant commit at the time of this handoff: `28e7afb` (`fix: route mobile label printing through app chooser`)
- Document page: `/documents/print`
- Admin prints documents per package, not per order.

### Client hardware

1. Packing nota printer:
   - Bluetooth name: `RPP02N`
   - Model shown on device: `MP-80M`
   - Paper: 80 mm thermal roll
   - Android print/bridge application: RawBT

2. Shipping label printer:
   - Bluetooth name/model: `XP-420B`
   - Manufacturer: Xprinter
   - Paper: 100 x 150 mm / 4 x 6 inch label
   - Android application: 4BarCode by vidaprinter

Both printers are paired over Bluetooth. Bluetooth pairing alone does not guarantee that Android's browser print service or an app has an active connection to the correct printer.

## Required outcome

### Packing nota

- Exactly one package nota is printed.
- Android preview and physical output must contain only the nota, never the application dashboard.
- Width must fit an 80 mm roll.
- Text must be as large/readable as the previously accepted output.
- No 5-page output.
- Nota should use the RPP02N printer through the intended RawBT/browser-print workflow.

### Shipping label

- Exactly one 100 x 150 mm (4 x 6 inch) label.
- It must be opened/printed using 4BarCode and the XP-420B, not RawBT/RPP02N.
- Text and recipient/address information must be large and readable.
- Page dimensions must remain 100 x 150 mm.
- Package A/B/C data must remain independent.

## Latest unresolved runtime evidence

### Nota still becomes 5 pages

Client screenshot: `WhatsApp Image 2026-08-14 at 20.58.56.jpeg`.

Observed:

- Printer selected: `RPP02N_18C5` / RPP02N.
- Paper selected: `80mm Roll`.
- Android preview reports `5/5` pages.
- Preview pages contain the actual web application cards, navigation, and other packages.
- Therefore the issue is not merely paper-size selection. The application page is entering the print document.

### Label PDF has correct dimensions but poor composition/readability

Client screenshot: `WhatsApp Image 2026-08-14 at 21.03.41.jpeg`.

Observed:

- 4BarCode recognizes the PDF as exactly `100.0 mm x 150.0 mm`.
- It reports one page (`1/1`).
- Content remains small and concentrated near the top; large unused whitespace remains.
- Therefore page dimensions are now correct, but label rendering/composition is not accepted.

## Current source flow

### Document queue

File: `frontend/src/pages/documents/DocumentPrintingPage.tsx`

- Packages are expanded from `order.packages`.
- Nota action calls `handlePrintNota(order, packageId)`.
- Label action calls `handlePrintLabel(packageCard)`.
- Print status is mutated through `orderService.printPackageDocument(packageId, document)` when the preview is opened, before physical printing can be proven.
- Modal components:
  - `PackingNotaModal`
  - `ShippingLabelModal`

### Packing nota

File: `frontend/src/components/orders/PackingNotaModal.tsx`

Current action:

```ts
printElementViaIframe(
  'packing-nota-printable',
  title,
  'size: 80mm auto;',
);
```

Important details:

- The component contains its own embedded `@media print` styles.
- The helper removes embedded `<style>` nodes from the clone, so the helper stylesheet becomes authoritative.
- `size: 80mm auto` may not be handled consistently by Android print services because CSS Paged Media support for an automatic second page dimension varies.

### Print helper

File: `frontend/src/utils/printHelper.ts`

Critical finding:

- Despite its name, `printElementViaIframe` does **not** create or print an iframe.
- It clones the target and appends `#antagloma-print-root` directly to the current application's `<body>`.
- It relies on print CSS to hide every other direct body child.
- It registers `afterprint` cleanup and also a 120-second safety cleanup.

This design can explain the 5-page Android failure:

1. Android/print-service behavior may snapshot the original application rather than the temporary clone.
2. `afterprint` may fire earlier than expected on mobile, removing the isolation root/style before the external print service finishes reading the document.
3. If the helper rules are not honored by the Android print compositor, the entire React application remains printable.
4. The screenshot proves the isolation CSS is not reliable on the client's Android print path.

### Shipping label

File: `frontend/src/components/orders/ShippingLabelModal.tsx`

Current Android-capable flow:

1. Render HTML label through `thermalPrinterService.renderToThermalCanvas(printableEl, 800)`.
2. Draw it onto an 800 x 1200 canvas.
3. Convert canvas to JPEG.
4. Embed the JPEG into a hand-built one-page PDF with MediaBox 288 x 432 points (exact 4 x 6 inch).
5. Prefer `navigator.share({ files: [labelFile] })` so Android presents an app chooser.
6. Admin must choose 4BarCode.
7. Browser print is a desktop/no-file-sharing fallback.

Critical finding:

- The label PDF is raster/JPEG, not vector text.
- The 100 x 150 mm page size is now correct.
- The current HTML layout intentionally uses `justify-between`/full-height spacing, placing the package summary near the bottom and leaving a large empty central area.
- Increasing canvas dimensions alone will improve sharpness but will not fix the composition.

### Thermal utility

File: `frontend/src/utils/thermalPrinter.ts`

- Uses `html2canvas` at scale 3.
- Label mode uses a 500 px CSS render width and a forced 750 px clone height.
- Output is resized to a target width (800 for labels).
- It also contains older Web Bluetooth, RawBT and TSPL/ESC-POS experiments. These methods are not necessarily the current primary modal actions.

## Attempts already made

Relevant commits, newest first:

- `28e7afb` route mobile label printing through app chooser
- `e516805` use browser print preview for shipping labels
- `22a7ee1` restore browser print flow for packing nota
- `ae299c8` refine thermal nota and label output
- `81d5110` enlarge thermal print typography
- `ee9fe86` stabilize thermal nota and label printing
- `0566f54` share shipping labels as 4BarCode PDF
- `ec87445` route label printing through Android share
- `d8aa6a4` isolate thermal document printing
- `0696ebe` align label RawBT print width
- `4845974` stabilize browser and RawBT thermal printing

Approaches observed during testing:

- Printing the current web page directly: caused blank or multiple application pages.
- Temporary same-document print root: still produces 5 pages on the client's Android path.
- Direct RawBT image/intent: could time out, require RawBT to be opened, select the wrong printer, or reduce output quality.
- Android browser/system print: produced good-looking desktop previews but is dependent on Android print-service behavior.
- Share-sheet PDF to 4BarCode: reliably reaches a one-page 100 x 150 mm document, but current label content is too small/poorly distributed.
- Attempting to force a third-party Android app directly from a website is not reliable. Android/app support controls deep-link and file association behavior.

## Most likely root causes

### Nota: high-confidence issue

The current helper is not a real isolated print document. It prints from the same DOM as the React application and depends on `@media print` hiding rules. The client's screenshot contains the dashboard and package cards, proving those rules/isolation are not reliable in their Android print service.

### Nota: additional compatibility issue

`@page { size: 80mm auto; }` may be ignored or interpreted unpredictably on Android. A fixed-width roll profile selected by the print service does not guarantee that Chrome honors an automatic page height.

### Label: high-confidence issue

The PDF page size is correct. The visual issue is caused by the rendered label composition and raster pipeline, not by the 100 x 150 mm MediaBox.

## Recommended next implementation

### Priority 1: replace same-document nota printing

Do not keep patching `body > *:not(#antagloma-print-root)`.

Use a genuinely standalone print document:

Option A (recommended first):

- Create an actual hidden iframe.
- Write a complete minimal HTML document into `iframe.contentDocument`.
- Copy only necessary styles and the nota markup.
- Wait for the iframe document and fonts to finish loading.
- Call `iframe.contentWindow.print()`.
- Do not remove it on the first mobile `afterprint`; defer cleanup safely.

Option B:

- Open a user-initiated popup/new tab containing only the nota HTML.
- Print from that standalone tab.
- Earlier attempts reportedly produced `about:blank`, so verify popup timing, document close/load, and mobile popup restrictions before choosing this route.

The key acceptance condition is that the print document DOM must not contain the React dashboard at all.

### Priority 2: make nota page sizing deterministic

- Test whether the selected Android print service correctly handles an 80 mm roll when the standalone document uses `width: 80mm`.
- Avoid assuming `size: 80mm auto` works.
- If needed, measure the rendered nota height and produce a fixed page height, or generate a one-page PDF with 80 mm width and measured content height.
- Preserve readable typography; do not solve page count by shrinking the nota.

### Priority 3: redesign label content within the already-correct page

- Keep one page at 100 x 150 mm.
- Remove the `justify-between` layout that creates a large empty center.
- Increase recipient name, phone, destination, and order/package identifier sizes.
- Place package summary immediately after address instead of forcing it to the bottom unless the client explicitly wants the bottom placement.
- Consider a vector PDF library (`pdf-lib`, `jsPDF`, or equivalent) for sharper text. If staying with canvas/JPEG, render at a substantially higher pixel size and validate the physical result.

### Priority 4: do not conflate print initiation and print success

`DocumentPrintingPage.tsx` currently marks the package document as printed when opening the modal/flow. Browser APIs do not expose reliable physical-print success. The next agent should document or reconsider this behavior separately, without breaking existing queue semantics.

## Reproduction checklist

### Nota

1. Use a package order containing at least two items.
2. Open `/documents/print` on the client's Android phone.
3. Open one package nota only.
4. Tap `Cetak Nota`.
5. Select RPP02N and 80mm Roll.
6. Verify preview says `1/1` and contains no dashboard/navigation/package cards.
7. Print physically.
8. Verify readable text and no excessive blank feed.

### Label

1. Open one package label.
2. Tap `Cetak Label`.
3. Select 4BarCode in Android's share sheet.
4. Confirm the app reads exactly 100 x 150 mm and `1/1`.
5. Print on XP-420B.
6. Verify content fills the intended label area and remains readable.

## Acceptance matrix

| Case | Expected |
|---|---|
| One nota package | 1 page only |
| Nota preview | No app dashboard or bottom navigation |
| Nota paper | 80 mm roll |
| Nota printer | RPP02N |
| One label package | 1 page only |
| Label dimensions | 100 x 150 mm / 4 x 6 inch |
| Label printer/app | XP-420B through 4BarCode |
| Multi-package | Package A/B/C data never mixed |
| Print failure/cancel | Must not be presented as proven physical success |

## Files to inspect first

- `frontend/src/utils/printHelper.ts`
- `frontend/src/components/orders/PackingNotaModal.tsx`
- `frontend/src/components/orders/ShippingLabelModal.tsx`
- `frontend/src/utils/thermalPrinter.ts`
- `frontend/src/pages/documents/DocumentPrintingPage.tsx`
- `frontend/src/services/orderService.ts`

## Constraints

- Do not change order/package lifecycle.
- Do not change shipment, tracking, Sales ownership, or sales-informed behavior.
- Do not add database migrations for printing output.
- Keep nota and label package-specific.
- Do not claim physical runtime PASS without testing on the client's Android phone and both printers.
- Do not commit/push until the user explicitly approves.

## Current verdict

`NOT READY` for final physical-print acceptance.

- Nota remains a critical failure because Android produces five pages containing application UI.
- Label page dimensions are correct, but the physical layout/readability still does not meet client expectations.
