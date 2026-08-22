export interface PackingNotaCanvasData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  packageType: string;
  weight?: string;
  address: string;
  items: Array<{ name: string; quantity: number }>;
  note: string;
  packageLetter: string;
  salesName: string;
  adminName: string;
}

// Browser counterpart of the PC and Android bitmap renderers. All three use
// 576 dots (80 mm / 203 dpi) and the same deterministic rows.
const WIDTH = 576;
// Keep a safe white tail after the staff signatures. This is also reserved by
// the Windows and Android bitmap renderers so the browser preview has the same
// final height and footer position as the physical printout.
const FOOTER_RESERVE = 132;
const wrap = (value: string, max: number) => {
  const lines: string[] = [];
  value.trim().split(/\s+/).filter(Boolean).forEach((word) => {
    const previous = lines[lines.length - 1];
    if (!previous || previous.length + word.length + 1 > max) lines.push(word);
    else lines[lines.length - 1] = `${previous} ${word}`;
  });
  return lines.length ? lines : [''];
};

const today = () => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());

const whatsapp = (c: CanvasRenderingContext2D, x: number, centerY: number, radius: number) => {
  c.save(); c.strokeStyle = '#000'; c.fillStyle = '#000'; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = Math.max(3, radius * .13); c.beginPath(); c.arc(x + radius, centerY, radius * .82, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(x + radius * .40, centerY + radius * .56); c.lineTo(x + radius * .25, centerY + radius * 1.05); c.lineTo(x + radius * .72, centerY + radius * .80); c.stroke();
  c.lineWidth = Math.max(3, radius * .25); c.beginPath(); c.moveTo(x + radius * .66, centerY - radius * .32); c.quadraticCurveTo(x + radius * .98, centerY + radius * .25, x + radius * 1.38, centerY + radius * .38); c.stroke(); c.restore();
};

export const createPackingNotaCanvas = (data: PackingNotaCanvasData) => {
  const addressLines = wrap(data.address, 34);
  const noteLines = wrap(data.note.trim() || '-', 36);
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  const targetHeight = 875 + addressLines.length * 36 + data.items.length * 64 + noteLines.length * 36 + FOOTER_RESERVE;
  canvas.height = targetHeight;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Gagal menyiapkan bitmap nota.');
  c.fillStyle = '#fff'; c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = '#000'; c.strokeStyle = '#000'; c.textBaseline = 'alphabetic';
  const font = (size: number, bold = false, align: CanvasTextAlign = 'left') => { c.font = `${bold ? '700' : '400'} ${size}px Arial, Helvetica, sans-serif`; c.textAlign = align; };
  const text = (value: string, x: number, y: number, size: number, bold = false, align: CanvasTextAlign = 'left') => { font(size, bold, align); c.fillText(value, x, y); };
  const divider = (y: number) => { c.lineWidth = 2.5; c.beginPath(); c.moveTo(16, y); c.lineTo(WIDTH - 16, y); c.stroke(); };

  text('ANTAGLOMA FLORIST', 18, 50, 31, true);
  text('Spesialis Adenium Bunga Tumpuk', 18, 76, 18);
  whatsapp(c, 18, 91, 10); text('0858-9450-3333 / 0857-3333-1889', 44, 98, 16);
  c.lineWidth = 2; c.strokeRect(WIDTH - 205, 18, 187, 46);
  text('NOTA PACKING', WIDTH - 111, 50, 19, true, 'center');
  text(data.orderNumber, WIDTH - 18, 96, 22, true, 'right');
  text(`Tgl: ${today()}`, WIDTH - 18, 121, 16, true, 'right');
  text(`Paket ${data.packageLetter}`, WIDTH - 18, 144, 19, true, 'right');
  let y = 166; divider(y); y += 35;
  text('PENERIMA / CUSTOMER:', 18, y, 19, true); y += 34;
  text(data.customerName, 18, y, 29, true); y += 31;
  text(data.customerPhone, 18, y, 22); y += 31;
  const packageType = data.packageType.trim() || 'NON FULLSET';
  const packageTypeLabel = `[ ${packageType.toUpperCase()} ]${data.weight ? `  •  ${data.weight}` : ''}`;
  text(packageTypeLabel, 18, y, 19, true); y += 28; divider(y); y += 36;
  text('ALAMAT PENGIRIMAN:', 18, y, 19, true); y += 33;
  addressLines.forEach((line) => { text(line, 18, y, 23, true); y += 32; }); y += 7; divider(y); y += 36;
  text('ITEM TANAMAN & BONSAI POT', 18, y, 21, true); y += 36;
  text('NO  VARIAN ADENIUM', 18, y, 20, true); text('UKURAN', WIDTH - 160, y, 19, true); text('QTY', WIDTH - 18, y, 20, true, 'right'); y += 15; divider(y); y += 36;
  data.items.forEach((item, index) => { text(`${index + 1}  ${item.name}`, 26, y, 21, true); text('Package', WIDTH - 150, y, 19); text(String(item.quantity), WIDTH - 24, y, 21, true, 'right'); y += 38; divider(y); y += 26; });
  c.lineWidth = 2; c.beginPath(); c.roundRect(18, y, WIDTH - 36, 142, 10); c.stroke();
  text('CATATAN PENGIRIMAN / PACKING KAYU:', 30, y + 33, 20, true); let noteY = y + 69;
  noteLines.forEach((line) => { text(line, 30, noteY, 19); noteY += 29; });
  y = Math.max(y + 170, targetHeight - 186); divider(y); y += 39;
  text('Sales', WIDTH * .16, y, 21, true, 'center'); text('Admin', WIDTH * .5, y, 21, true, 'center'); text('Packing', WIDTH * .84, y, 21, true, 'center');
  y += 40; divider(y); y += 35;
  text(data.salesName || 'Sales Staff', WIDTH * .16, y, 19, true, 'center'); text(data.adminName || 'Admin Operasional', WIDTH * .5, y, 19, true, 'center'); text('( Staff )', WIDTH * .84, y, 19, true, 'center');
  return canvas;
};
