// Bluetooth ESC/POS Thermal Printer Utility for Web Bluetooth API
import html2canvas from 'html2canvas';

export interface BluetoothDeviceConfig {
  device: any;
  server?: any;
  characteristic?: any;
  connected: boolean;
  name: string;
}

class ThermalPrinterService {
  private notaConfig: BluetoothDeviceConfig | null = null;
  private labelConfig: BluetoothDeviceConfig | null = null;
  private deviceConfig: BluetoothDeviceConfig | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'bluetooth' in navigator;
  }

  public getConnectedDeviceName(type: 'nota' | 'label' = 'nota'): string | null {
    const config = type === 'label' ? this.labelConfig : this.notaConfig;
    return config?.connected ? config.name : (this.deviceConfig?.connected ? this.deviceConfig.name : null);
  }

  public async connect(type: 'nota' | 'label' = 'nota'): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth API tidak didukung oleh browser ini. Gunakan Chrome/Edge di Android/Windows.');
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        ],
      });

      return await this.setupDevice(device, type);
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error('Pencarian printer dibatalkan oleh pengguna.');
      }
      throw new Error(err.message || 'Gagal terhubung ke printer Bluetooth.');
    }
  }

  private async setupDevice(device: any, type: 'nota' | 'label' = 'nota'): Promise<string> {
    const server = await device.gatt.connect();

    // Find writable characteristic
    let characteristic: any = null;
    const services = await server.getPrimaryServices();

    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          characteristic = char;
          break;
        }
      }
      if (characteristic) break;
    }

    if (!characteristic) {
      throw new Error('Tidak dapat menemukan jalur kirim data (Characteristic Write) pada printer Bluetooth ini.');
    }

    const config: BluetoothDeviceConfig = {
      device,
      server,
      characteristic,
      connected: true,
      name: device.name || `Printer ${type === 'label' ? 'Label 10cm' : 'Nota 8cm'}`,
    };

    if (type === 'label') {
      this.labelConfig = config;
    } else {
      this.notaConfig = config;
    }
    this.deviceConfig = config;

    device.addEventListener('gattserverdisconnected', () => {
      config.connected = false;
    });

    return config.name;
  }

  public async ensureConnected(type: 'nota' | 'label' = 'nota'): Promise<void> {
    const config = type === 'label' ? this.labelConfig : this.notaConfig;
    if (!config || !config.device) {
      await this.connect(type);
      return;
    }

    if (!config.device.gatt.connected) {
      await this.setupDevice(config.device, type);
    }
  }

  public async printRaw(data: Uint8Array, type: 'nota' | 'label' = 'nota'): Promise<void> {
    await this.ensureConnected(type);

    const config = (type === 'label' ? this.labelConfig : this.notaConfig) || this.deviceConfig;
    if (!config || !config.characteristic) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }

    const CHUNK_SIZE = 512;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (config.characteristic.properties.writeWithoutResponse) {
        await config.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await config.characteristic.writeValue(chunk);
      }
      await new Promise((res) => setTimeout(res, 40));
    }
  }

  /**
   * Render HTML element to ultra-sharp 1-bit monochrome bitmap canvas for thermal printers.
   * Renders at 3x High-DPI resolution with sharp luminance binarization so printed output is 100% crystal clear.
   */
  public async renderToThermalCanvas(element: HTMLElement, targetWidth = 576): Promise<{ canvas: HTMLCanvasElement; imageBytes: Uint8Array; width: number; height: number }> {
    const isLabel = targetWidth >= 700;
    const cssRenderWidth = isLabel ? 500 : 384;
    const targetScale = 3; // 3x High-DPI scale for crystal clear vector text & crisp lines

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = `${cssRenderWidth}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#000000';
    container.style.boxSizing = 'border-box';
    container.style.padding = isLabel ? '0' : '12px 8px 16px 8px';
    container.style.fontFamily = 'Arial, Helvetica, sans-serif';

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';
    if (isLabel) {
      // The 4-inch label is 100x150 mm (2:3). Keep the cloned printable area
      // at that full ratio so its flex layout uses the whole sticker instead
      // of collapsing the content into the upper half of the PDF.
      clone.style.height = '750px';
      clone.style.minHeight = '750px';
      clone.style.overflow = 'hidden';
    }
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.borderRadius = '0';
    clone.style.transform = 'none';
    clone.style.color = '#000000';

    // Force crisp dark contrast on all child elements
    const allNodes = clone.querySelectorAll('*');
    allNodes.forEach((node: any) => {
      if (node.style) {
        node.style.color = '#000000';
        node.style.borderColor = '#000000';
      }
    });

    container.appendChild(clone);
    document.body.appendChild(container);

    let highResCanvas: HTMLCanvasElement;
    try {
      highResCanvas = await html2canvas(container, {
        scale: targetScale,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        width: cssRenderWidth,
      });
    } finally {
      document.body.removeChild(container);
    }

    const aspect = highResCanvas.height / highResCanvas.width;
    const width = targetWidth;
    const height = Math.round(targetWidth * aspect);

    const monoCanvas = document.createElement('canvas');
    monoCanvas.width = width;
    monoCanvas.height = height;
    const ctx = monoCanvas.getContext('2d');

    if (!ctx) throw new Error('Gagal memproses gambar cetak.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(highResCanvas, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    const bytesPerLine = width / 8;
    const imageBytes = new Uint8Array(bytesPerLine * height);

    // Apply Sharp Binarization with Adaptive Contrast Thresholding (185)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];

        // Perceived luminance formula
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // Sharp threshold at 185: eliminates fuzzy anti-alias gray pixels into jet black
        const isBlack = luminance < 185;

        if (isBlack) {
          const byteIndex = y * bytesPerLine + Math.floor(x / 8);
          const bitIndex = 7 - (x % 8);
          imageBytes[byteIndex] |= 1 << bitIndex;
          pixels[offset] = 0;
          pixels[offset + 1] = 0;
          pixels[offset + 2] = 0;
          pixels[offset + 3] = 255;
        } else {
          pixels[offset] = 255;
          pixels[offset + 1] = 255;
          pixels[offset + 2] = 255;
          pixels[offset + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return { canvas: monoCanvas, imageBytes, width, height };
  }

  /**
   * Generate Data URL PNG image simulation of 100% exact thermal printer output
   */
  public async generateThermalBitmapDataUrl(element: HTMLElement, targetWidth = 576): Promise<string> {
    const { canvas } = await this.renderToThermalCanvas(element, targetWidth);
    return canvas.toDataURL('image/png');
  }

  /**
   * Print directly via ESC/POS raster commands GS v 0.
   */
  public async printElementAsBitmap(element: HTMLElement, targetWidth = 576, type: 'nota' | 'label' = 'nota'): Promise<void> {
    const { imageBytes, width, height } = await this.renderToThermalCanvas(element, targetWidth);
    const bytesPerLine = width / 8;

    // ESC/POS GS v 0 command: GS v 0 m xL xH yL yH data...
    const xL = bytesPerLine & 0xff;
    const xH = (bytesPerLine >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;

    const initCmd = new Uint8Array([0x1b, 0x40]); // ESC @
    const gsV0Header = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
    const feedCut = new Uint8Array([0x1b, 0x64, 0x04]); // ESC d 4 (Feed 4 lines)

    const fullBuffer = new Uint8Array(initCmd.length + gsV0Header.length + imageBytes.length + feedCut.length);
    fullBuffer.set(initCmd, 0);
    fullBuffer.set(gsV0Header, initCmd.length);
    fullBuffer.set(imageBytes, initCmd.length + gsV0Header.length);
    fullBuffer.set(feedCut, initCmd.length + gsV0Header.length + imageBytes.length);

    await this.printRaw(fullBuffer, type);
  }

  /**
   * Print directly via TSPL bitmap command (for Xprinter XP-420B / Barcode Label Printers)
   */
  public async printElementAsTSPL(element: HTMLElement, targetWidth = 800, type: 'label' | 'nota' = 'label'): Promise<void> {
    const { imageBytes, width, height } = await this.renderToThermalCanvas(element, targetWidth);
    const bytesPerLine = width / 8;
    const widthMm = Math.round(width / 8); // 800 / 8 = 100mm
    const heightMm = Math.round(height / 8);

    const encoder = new TextEncoder();
    const tsplHeaderStr =
      `SIZE ${widthMm} mm,${heightMm} mm\r\n` +
      `GAP 2 mm,0 mm\r\n` +
      `DIRECTION 1\r\n` +
      `CLS\r\n` +
      `BITMAP 0,0,${bytesPerLine},${height},0,`;
    const tsplHeader = encoder.encode(tsplHeaderStr);
    const tsplFooter = encoder.encode(`\r\nPRINT 1,1\r\n`);

    const fullBuffer = new Uint8Array(tsplHeader.length + imageBytes.length + tsplFooter.length);
    fullBuffer.set(tsplHeader, 0);
    fullBuffer.set(imageBytes, tsplHeader.length);
    fullBuffer.set(tsplFooter, tsplHeader.length + imageBytes.length);

    await this.printRaw(fullBuffer, type);
  }

  /**
   * Send high-clarity 1-bit thermal bitmap directly to RawBT app via Android Intent
   */
  public async sendToRawBT(element: HTMLElement, targetWidth = 576): Promise<void> {
    const dataUrl = await this.generateThermalBitmapDataUrl(element, targetWidth);
    const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, '');
    
    // Direct rawbt scheme link (prevents auto-redirecting to PlayStore if app not installed)
    // RawBT expects the image as a data URI after the rawbt scheme.
    // Without the `data:` segment RawBT may treat the payload as plain text.
    const rawbtUrl = `rawbt:data:image/png;base64,${base64Data}`;
    const link = document.createElement('a');
    link.href = rawbtUrl;
    link.click();
  }

  // Convert text string to ESC/POS commands
  public async printEscPosText(text: string): Promise<void> {
    const encoder = new TextEncoder();
    const initCmd = new Uint8Array([0x1b, 0x40]);
    const feedCut = new Uint8Array([0x1d, 0x56, 0x42, 0x00]);

    const bytesText = encoder.encode(text + '\n\n\n');
    const fullData = new Uint8Array(initCmd.length + bytesText.length + feedCut.length);
    fullData.set(initCmd, 0);
    fullData.set(bytesText, initCmd.length);
    fullData.set(feedCut, initCmd.length + bytesText.length);

    await this.printRaw(fullData);
  }
}

export const thermalPrinterService = new ThermalPrinterService();
