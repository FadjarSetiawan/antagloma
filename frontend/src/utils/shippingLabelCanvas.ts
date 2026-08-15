export interface ShippingLabelCanvasData {
  subOrderNumber: string;
  packageType: string;
  customerName: string;
  customerPhone: string;
  destinationArea: string;
  fullAddress: string;
  itemsSummary: string;
}

const LABEL_WIDTH = 1200;
const LABEL_HEIGHT = 1800;
const MARGIN = 64;
const CONTENT_WIDTH = LABEL_WIDTH - (MARGIN * 2);

const setFont = (
  context: CanvasRenderingContext2D,
  size: number,
  weight: 'normal' | '600' | '700' | '800' = 'normal',
) => {
  context.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
};

const fitFontSize = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  preferredSize: number,
  minimumSize: number,
  weight: 'normal' | '600' | '700' | '800' = '700',
) => {
  let size = preferredSize;
  setFont(context, size, weight);
  while (size > minimumSize && context.measureText(text).width > maxWidth) {
    size -= 1;
    setFont(context, size, weight);
  }
  return size;
};

const splitLongWord = (
  context: CanvasRenderingContext2D,
  word: string,
  maxWidth: number,
) => {
  const chunks: string[] = [];
  let current = '';

  Array.from(word).forEach((character) => {
    const candidate = `${current}${character}`;
    if (current && context.measureText(candidate).width > maxWidth) {
      chunks.push(current);
      current = character;
    } else {
      current = candidate;
    }
  });

  if (current) chunks.push(current);
  return chunks;
};

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
) => {
  const normalized = text.trim() || '-';
  const sourceWords = normalized.split(/\s+/);
  const words = sourceWords.flatMap((word) => (
    context.measureText(word).width > maxWidth
      ? splitLongWord(context, word, maxWidth)
      : [word]
  ));
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  });
  if (currentLine) lines.push(currentLine);

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines && visibleLines.length > 0) {
    let lastLine = visibleLines[visibleLines.length - 1];
    while (lastLine.length > 1 && context.measureText(`${lastLine}...`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1);
    }
    visibleLines[visibleLines.length - 1] = `${lastLine.trim()}...`;
  }

  visibleLines.forEach((line, index) => {
    context.fillText(line, x, startY + (index * lineHeight));
  });

  return startY + (visibleLines.length * lineHeight);
};

const drawDivider = (context: CanvasRenderingContext2D, y: number) => {
  context.beginPath();
  context.moveTo(MARGIN, y);
  context.lineTo(LABEL_WIDTH - MARGIN, y);
  context.lineWidth = 6;
  context.strokeStyle = '#000000';
  context.stroke();
};

const drawRoundedRectangle = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

export const createShippingLabelCanvas = (data: ShippingLabelCanvasData) => {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_WIDTH;
  canvas.height = LABEL_HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Gagal menyiapkan canvas label.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, LABEL_WIDTH, LABEL_HEIGHT);
  context.fillStyle = '#000000';
  context.textBaseline = 'top';

  const rightX = 675;
  const rightWidth = LABEL_WIDTH - MARGIN - rightX;

  setFont(context, 54, '800');
  context.fillText('ANTAGLOMA FLORIST', MARGIN, 68);
  setFont(context, 31, '700');
  context.fillText('Spesialis Adenium Bunga Tumpuk', MARGIN, 136);
  setFont(context, 28, '600');
  context.fillText('0858-9450-3333', MARGIN, 184);
  context.fillText('0857-3333-1889', MARGIN, 224);

  const badgeWidth = 270;
  const badgeHeight = 62;
  const badgeX = LABEL_WIDTH - MARGIN - badgeWidth;
  context.strokeStyle = '#000000';
  context.lineWidth = 5;
  context.strokeRect(badgeX, 62, badgeWidth, badgeHeight);
  setFont(context, 28, '800');
  context.textAlign = 'center';
  context.fillText('STIKER RESI', badgeX + (badgeWidth / 2), 78);

  context.textAlign = 'right';
  fitFontSize(context, data.subOrderNumber, rightWidth, 38, 27, '800');
  context.fillText(data.subOrderNumber, LABEL_WIDTH - MARGIN, 150);
  fitFontSize(context, `[ ${data.packageType.toUpperCase()} ]`, rightWidth, 32, 24, '800');
  context.fillText(`[ ${data.packageType.toUpperCase()} ]`, LABEL_WIDTH - MARGIN, 204);
  context.textAlign = 'left';

  // Keep the fixed header columns independent. This is deliberately not based
  // on the responsive modal DOM, so a narrow Android viewport cannot collapse
  // the sender text into the order number.
  drawDivider(context, 300);

  setFont(context, 29, '800');
  context.fillText('PENERIMA / CUSTOMER:', MARGIN, 340);
  setFont(context, 58, '800');
  const customerY = drawWrappedText(context, data.customerName, MARGIN, 388, CONTENT_WIDTH, 66, 2);
  setFont(context, 43, '700');
  context.fillText(data.customerPhone || '-', MARGIN, customerY + 6);
  const recipientDividerY = customerY + 74;
  drawDivider(context, recipientDividerY);

  setFont(context, 29, '800');
  context.fillText('ALAMAT PENGIRIMAN:', MARGIN, recipientDividerY + 38);
  setFont(context, 43, '800');
  const areaEndY = drawWrappedText(
    context,
    data.destinationArea,
    MARGIN,
    recipientDividerY + 88,
    CONTENT_WIDTH,
    53,
    3,
  );
  setFont(context, 34, '600');
  const addressEndY = drawWrappedText(
    context,
    data.fullAddress,
    MARGIN,
    areaEndY + 13,
    CONTENT_WIDTH,
    44,
    3,
  );

  const addressDividerY = Math.min(Math.max(addressEndY + 35, 950), 1220);
  drawDivider(context, addressDividerY);

  const boxY = Math.max(addressDividerY + 48, 1320);
  const boxHeight = 120;
  context.strokeStyle = '#000000';
  context.lineWidth = 5;
  const radius = 20;
  drawRoundedRectangle(context, MARGIN, boxY, CONTENT_WIDTH, boxHeight, radius);
  context.stroke();
  setFont(context, 36, '800');
  context.fillText(`Isi Paket: ${data.itemsSummary || 'Tanaman'}`, MARGIN + 30, boxY + 38);

  return canvas;
};
