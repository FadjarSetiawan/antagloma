export interface ShippingLabelCanvasData {
  subOrderNumber: string;
  customerName: string;
  customerPhone: string;
  destinationArea: string;
  fullAddress: string;
  itemsSummary: string;
  itemLines?: string[];
  layout?: Record<string, { x?: number; y?: number; scale?: number }>;
}

// Keep this canvas at the identical XP-420B target resolution used by Android:
// 100 mm x 150 mm at 203 DPI = approximately 800 x 1200 dots.
const WIDTH = 800;
const HEIGHT = 1198;
const black = '#000000';

const font = (c: CanvasRenderingContext2D, size: number, bold = false) => {
  c.font = `${bold ? '700' : '400'} ${size}px Arial, Helvetica, sans-serif`;
};

const roundRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
};

// Android uses deterministic word wrapping by character count. Reproduce it here
// rather than relying on the responsive browser width.
const wrap = (value: string, maxChars: number) => {
  const lines: string[] = [];
  (value.trim().split(/\s+/).filter(Boolean)).forEach((word) => {
    const last = lines[lines.length - 1];
    if (!last || `${last} ${word}`.length > maxChars) lines.push(word);
    else lines[lines.length - 1] = `${last} ${word}`;
  });
  return lines.length ? lines : ['-'];
};

const dateToday = () => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());

const plant = (c: CanvasRenderingContext2D) => {
  c.fillStyle = black;
  c.fillRect(93, 78, 6, 45);
  c.beginPath(); c.moveTo(94, 105); c.bezierCurveTo(70, 103, 61, 82, 70, 68); c.bezierCurveTo(88, 70, 95, 87, 94, 105); c.fill();
  c.beginPath(); c.moveTo(98, 105); c.bezierCurveTo(122, 103, 131, 82, 122, 68); c.bezierCurveTo(104, 70, 97, 87, 98, 105); c.fill();
  c.beginPath(); c.moveTo(96, 92); c.bezierCurveTo(82, 77, 87, 56, 96, 48); c.bezierCurveTo(105, 56, 110, 77, 96, 92); c.fill();
  roundRect(c, 70, 116, 52, 8, 2); c.fill();
  c.beginPath(); c.moveTo(74, 125); c.lineTo(118, 125); c.lineTo(112, 147); c.lineTo(80, 147); c.closePath(); c.fill();
};

const whatsapp = (c: CanvasRenderingContext2D, x: number, centerY: number, radius: number) => {
  // Match the line-art WhatsApp mark used by the Android bitmap: outline,
  // speech tail, then handset. The previous solid disc looked like a phone dot.
  c.save(); c.strokeStyle = black; c.fillStyle = black; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = Math.max(3, radius * .13); c.beginPath(); c.arc(x + radius, centerY, radius * .82, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(x + radius * .40, centerY + radius * .56); c.lineTo(x + radius * .25, centerY + radius * 1.05); c.lineTo(x + radius * .72, centerY + radius * .80); c.stroke();
  c.lineWidth = Math.max(3, radius * .25); c.beginPath(); c.moveTo(x + radius * .66, centerY - radius * .32); c.quadraticCurveTo(x + radius * .98, centerY + radius * .25, x + radius * 1.38, centerY + radius * .38); c.stroke(); c.restore();
};

export const createShippingLabelCanvas = (data: ShippingLabelCanvasData) => {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Gagal menyiapkan canvas label.');
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, WIDTH, HEIGHT); c.fillStyle = black; c.strokeStyle = black; c.textBaseline = 'alphabetic';
  const adjustment = (element: string) => data.layout?.[element] || {};
  const x = (element: string, value: number) => value + (adjustment(element).x || 0);
  const yFor = (element: string, value: number) => value + (adjustment(element).y || 0);
  const scale = (element: string, value: number) => value * (adjustment(element).scale || 1);
  c.lineWidth = 5; roundRect(c, 24, 24, WIDTH - 48, HEIGHT - 48, 22); c.stroke();
  plant(c);
  font(c, scale('brand', 35), true); c.fillText('ANTAGLOMA FLORIST', x('brand', 148), yFor('brand', 88));
  font(c, scale('brand', 21), true); c.fillText('SPESIALIS ADENIUM BUNGA TUMPUK', x('brand', 148), yFor('brand', 122));
  roundRect(c, WIDTH - 235, 54, 181, 64, 12); c.fill(); c.fillStyle = '#ffffff'; font(c, 25, true); c.textAlign = 'center'; c.fillText('STIKER RESI', WIDTH - 145, 97); c.textAlign = 'left'; c.fillStyle = black;
  font(c, scale('order', 31), true); c.fillText(`ORDER:   ${data.subOrderNumber}`, x('order', 68), yFor('order', 205)); c.beginPath(); c.moveTo(52, yFor('order', 235)); c.lineTo(WIDTH - 52, yFor('order', 235)); c.stroke();
  roundRect(c, 66, 260, 164, 48, 10); c.fill(); c.fillStyle = '#ffffff'; font(c, 22, true); c.textAlign = 'center'; c.fillText('PENERIMA', 148, 293); c.textAlign = 'left'; c.fillStyle = black;
  font(c, scale('recipient', 68), true); c.fillText(data.customerName || '-', x('recipient', 68), yFor('recipient', 380));
  whatsapp(c, x('recipient', 68), yFor('recipient', 423), scale('recipient', 28)); font(c, scale('recipient', 37), true); c.fillText(data.customerPhone || '-', x('recipient', 136), yFor('recipient', 445));
  roundRect(c, 66, 470, 328, 48, 10); c.fill(); c.fillStyle = '#ffffff'; font(c, 21, true); c.textAlign = 'center'; c.fillText('ALAMAT PENGIRIMAN', 230, 503); c.textAlign = 'left'; c.fillStyle = black;
  const address = `${data.destinationArea || ''}, ${data.fullAddress || ''}`.replace(/^, |, $/g, '').replace(/^Kec\./i, 'KEC.');
  let y = 570;
  wrap(address, 39).slice(0, 3).forEach((line, index) => { font(c, scale('address', index === 0 ? 28 : 26), true); c.fillText(line, x('address', 68), yFor('address', y)); y += 30; });
  y = Math.max(y + 2, 660);
  // Explicit section card/borders. Keep these strokes independent of text so
  // the web preview preserves the same visual separators as the APK bitmap.
  c.strokeStyle = black; c.lineWidth = 5; roundRect(c, 64, y, WIDTH - 128, 210, 20); c.stroke();
  font(c, 29, true); c.fillText('ISI PAKET', 98, y + 50);
  font(c, 47, true); c.fillText(data.itemsSummary || 'Tanaman', 98, y + 112);
  c.lineWidth = 3; c.beginPath(); c.moveTo(84, y + 138); c.lineTo(WIDTH - 84, y + 138); c.stroke();
  let itemY = y + 170;
  (data.itemLines?.length ? data.itemLines : ['Tanaman']).slice(0, 2).forEach((item) => { font(c, 22, true); c.fillText(`• ${item}`, 98, itemY); itemY += 28; });
  const senderY = y + 224;
  c.fillStyle = black; roundRect(c, 64, senderY, 166, 36, 9); c.fill(); c.fillStyle = '#ffffff'; font(c, 18, true); c.textAlign = 'center'; c.fillText('PENGIRIM', 147, senderY + 25); c.textAlign = 'left'; c.fillStyle = black;
  font(c, 23, true); c.fillText('ANTAGLOMA FLORIST', 74, senderY + 64);
  whatsapp(c, 74, senderY + 85, 11); font(c, 17, true); c.fillText('0858-9450-3333 / 0857-3333-1889', 102, senderY + 93);
  const footerY = senderY + 110; c.strokeStyle = black; c.lineWidth = 5; c.beginPath(); c.moveTo(52, footerY); c.lineTo(WIDTH - 52, footerY); c.stroke();
  font(c, 16, true); c.fillText('TANGGAL CETAK', 74, footerY + 32); c.fillText('ADMIN', WIDTH * .56, footerY + 32);
  font(c, 18); c.fillText(dateToday(), 74, footerY + 55); c.fillText('Admin Operasional', WIDTH * .56, footerY + 55);
  const closingY = footerY + 68; c.strokeStyle = black; c.lineWidth = 3; c.beginPath(); c.moveTo(52, closingY); c.lineTo(WIDTH - 52, closingY); c.stroke();
  font(c, scale('footer_message', 19), true); c.textAlign = 'center'; c.fillText('Terimakasih telah berbelanja di Antagloma Florist ♡', x('footer_message', WIDTH / 2), yFor('footer_message', closingY + 55)); c.textAlign = 'left';
  return canvas;
};
