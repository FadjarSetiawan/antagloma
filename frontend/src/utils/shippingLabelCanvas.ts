export interface ShippingLabelCanvasData {
  subOrderNumber: string;
  customerName: string;
  customerPhone: string;
  destinationArea: string;
  fullAddress: string;
  itemsSummary: string;
  itemLines?: string[];
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
  c.fillStyle = black; c.beginPath(); c.arc(x + radius, centerY, radius, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#ffffff'; c.lineCap = 'round'; c.lineWidth = radius * .38; c.beginPath(); c.moveTo(x + radius * .68, centerY - radius * .18); c.lineTo(x + radius * 1.23, centerY + radius * .30); c.stroke();
  c.lineWidth = radius * .30; c.beginPath(); c.moveTo(x + radius * .55, centerY - radius * .40); c.lineTo(x + radius * .77, centerY - radius * .18); c.moveTo(x + radius * 1.16, centerY + radius * .28); c.lineTo(x + radius * 1.38, centerY + radius * .49); c.stroke();
  c.fillStyle = black; c.beginPath(); c.moveTo(x + radius * .35, centerY + radius * .62); c.lineTo(x + radius * .44, centerY + radius * 1.15); c.lineTo(x + radius * .82, centerY + radius * .80); c.closePath(); c.fill(); c.lineCap = 'butt';
};

export const createShippingLabelCanvas = (data: ShippingLabelCanvasData) => {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Gagal menyiapkan canvas label.');
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, WIDTH, HEIGHT); c.fillStyle = black; c.strokeStyle = black; c.textBaseline = 'alphabetic';
  c.lineWidth = 5; roundRect(c, 24, 24, WIDTH - 48, HEIGHT - 48, 22); c.stroke();
  plant(c);
  font(c, 35, true); c.fillText('ANTAGLOMA FLORIST', 148, 88);
  font(c, 21, true); c.fillText('SPESIALIS ADENIUM BUNGA TUMPUK', 148, 122);
  roundRect(c, WIDTH - 235, 54, 181, 64, 12); c.fill(); c.fillStyle = '#ffffff'; font(c, 25, true); c.textAlign = 'center'; c.fillText('STIKER RESI', WIDTH - 145, 97); c.textAlign = 'left'; c.fillStyle = black;
  font(c, 31, true); c.fillText(`ORDER:   ${data.subOrderNumber}`, 68, 205); c.beginPath(); c.moveTo(52, 235); c.lineTo(WIDTH - 52, 235); c.stroke();
  roundRect(c, 66, 260, 164, 48, 10); c.fill(); c.fillStyle = '#ffffff'; font(c, 22, true); c.textAlign = 'center'; c.fillText('PENERIMA', 148, 293); c.textAlign = 'left'; c.fillStyle = black;
  font(c, 68, true); c.fillText(data.customerName || '-', 68, 380);
  whatsapp(c, 68, 423, 28); font(c, 37, true); c.fillText(data.customerPhone || '-', 136, 445);
  roundRect(c, 66, 470, 328, 48, 10); c.fill(); c.fillStyle = '#ffffff'; font(c, 21, true); c.textAlign = 'center'; c.fillText('ALAMAT PENGIRIMAN', 230, 503); c.textAlign = 'left'; c.fillStyle = black;
  const address = `${data.destinationArea || ''}, ${data.fullAddress || ''}`.replace(/^, |, $/g, '').replace(/^Kec\./i, 'KEC.');
  let y = 570;
  wrap(address, 39).slice(0, 3).forEach((line, index) => { font(c, index === 0 ? 28 : 26, true); c.fillText(line, 68, y); y += 30; });
  y = Math.max(y + 2, 660);
  c.lineWidth = 5; roundRect(c, 64, y, WIDTH - 128, 210, 20); c.stroke();
  font(c, 29, true); c.fillText('ISI PAKET', 98, y + 50);
  font(c, 47, true); c.fillText(data.itemsSummary || 'Tanaman', 98, y + 112);
  c.lineWidth = 3; c.beginPath(); c.moveTo(84, y + 138); c.lineTo(WIDTH - 84, y + 138); c.stroke();
  let itemY = y + 170;
  (data.itemLines?.length ? data.itemLines : ['Tanaman']).slice(0, 2).forEach((item) => { font(c, 22, true); c.fillText(`• ${item}`, 98, itemY); itemY += 28; });
  const senderY = y + 224;
  c.fillStyle = black; roundRect(c, 64, senderY, 166, 36, 9); c.fill(); c.fillStyle = '#ffffff'; font(c, 18, true); c.textAlign = 'center'; c.fillText('PENGIRIM', 147, senderY + 25); c.textAlign = 'left'; c.fillStyle = black;
  font(c, 23, true); c.fillText('ANTAGLOMA FLORIST', 74, senderY + 64);
  whatsapp(c, 74, senderY + 85, 11); font(c, 17, true); c.fillText('0858-9450-3333 / 0857-3333-1889', 102, senderY + 93);
  const footerY = senderY + 110; c.lineWidth = 5; c.beginPath(); c.moveTo(52, footerY); c.lineTo(WIDTH - 52, footerY); c.stroke();
  font(c, 16, true); c.fillText('TANGGAL CETAK', 74, footerY + 32); c.fillText('ADMIN', WIDTH * .56, footerY + 32);
  font(c, 18); c.fillText(dateToday(), 74, footerY + 55); c.fillText('Admin Operasional', WIDTH * .56, footerY + 55);
  const closingY = footerY + 68; c.lineWidth = 3; c.beginPath(); c.moveTo(52, closingY); c.lineTo(WIDTH - 52, closingY); c.stroke();
  font(c, 19, true); c.textAlign = 'center'; c.fillText('Terimakasih telah berbelanja di Antagloma Florist ♡', WIDTH / 2, closingY + 30); c.textAlign = 'left';
  return canvas;
};
