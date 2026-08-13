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
  private deviceConfig: BluetoothDeviceConfig | null = null;
  private readonly localVirtualPrinterUrl = 'http://localhost:3000/api/print';

  public isSupported(): boolean {
    return typeof window !== 'undefined';
  }

  public getConnectedDeviceName(): string | null {
    return this.deviceConfig?.connected ? this.deviceConfig.name : null;
  }

  public async connect(): Promise<string> {
    try {
      const response = await fetch(this.localVirtualPrinterUrl, { method: 'GET', mode: 'cors', cache: 'no-store' });
      if (!response.ok) throw new Error('Virtual Thermal Printer lokal belum berjalan.');
      this.deviceConfig = { device: null, characteristic: null, connected: true, name: 'ThermalLab Virtual Printer (localhost)' };
      return this.deviceConfig.name;
    } catch (err: any) {
      if (err instanceof TypeError) {
        throw new Error('Gagal mengakses Virtual Thermal Printer. Pastikan http://localhost:3000 terbuka dan tidak diblokir browser.');
      }
      throw new Error(err.message || 'Virtual Thermal Printer lokal belum terhubung.');
    }
  }

  private async setupDevice(device: any): Promise<string> {
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

    this.deviceConfig = {
      device,
      server,
      characteristic,
      connected: true,
      name: device.name || 'Printer Thermal Bluetooth',
    };

    device.addEventListener('gattserverdisconnected', () => {
      if (this.deviceConfig) {
        this.deviceConfig.connected = false;
      }
    });

    return this.deviceConfig.name;
  }

  public async ensureConnected(): Promise<void> {
    if (!this.deviceConfig?.connected) {
      await this.connect();
    }
  }

  public async printRaw(data: Uint8Array): Promise<void> {
    await this.ensureConnected();
    const response = await fetch(this.localVirtualPrinterUrl, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: data as unknown as BodyInit });
    if (!response.ok) throw new Error('Gagal mengirim nota ke Virtual Thermal Printer lokal.');
  }

  /**
   * Render HTML element to high-clarity 576px wide 1-bit monochrome bitmap canvas for 80mm thermal printers
   */
  public async renderToThermalCanvas(element: HTMLElement, targetWidth = 576): Promise<{ canvas: HTMLCanvasElement; imageBytes: Uint8Array; width: number; height: number }> {
    // Create temporary off-screen container with exact fixed 576px width for 1:1 pixel rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = `${targetWidth}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#000000';
    container.style.boxSizing = 'border-box';
    container.style.padding = '8px';

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.borderRadius = '0';
    clone.style.transform = 'none';

    container.appendChild(clone);
    document.body.appendChild(container);

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        width: targetWidth,
      });
    } finally {
      document.body.removeChild(container);
    }

    const aspect = canvas.height / canvas.width;
    const width = targetWidth; // 576 pixels for 80mm thermal printer head
    const height = Math.round(targetWidth * aspect);

    const monoCanvas = document.createElement('canvas');
    monoCanvas.width = width;
    monoCanvas.height = height;
    const ctx = monoCanvas.getContext('2d');

    if (!ctx) throw new Error('Gagal memproses gambar cetak.');

    ctx.imageSmoothingEnabled = false; // Keep text pixel edges crisp
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(canvas, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    // Convert RGBA pixels into 1-bit monochrome raster data using optimal sharp luminance thresholding (160)
    const bytesPerLine = width / 8;
    const imageBytes = new Uint8Array(bytesPerLine * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        const isBlack = brightness < 160;

        if (isBlack) {
          const byteIndex = y * bytesPerLine + Math.floor(x / 8);
          const bitIndex = 7 - (x % 8);
          imageBytes[byteIndex] |= 1 << bitIndex;
          pixels[offset] = 0;
          pixels[offset + 1] = 0;
          pixels[offset + 2] = 0;
        } else {
          pixels[offset] = 255;
          pixels[offset + 1] = 255;
          pixels[offset + 2] = 255;
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
  public async printElementAsBitmap(element: HTMLElement, targetWidth = 576): Promise<void> {
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

    await this.printRaw(fullBuffer);
  }

  // Convert text string to ESC/POS commands
  public async printEscPosText(text: string): Promise<void> {
    const encoder = new TextEncoder();
    const initCmd = new Uint8Array([0x1b, 0x40]); // ESC @ (Initialize printer)
    const feedCut = new Uint8Array([0x1d, 0x56, 0x42, 0x00]); // GS V B 0 (Feed and Cut)

    const bytesText = encoder.encode(text + '\n\n\n');
    const fullData = new Uint8Array(initCmd.length + bytesText.length + feedCut.length);
    fullData.set(initCmd, 0);
    fullData.set(bytesText, initCmd.length);
    fullData.set(feedCut, initCmd.length + bytesText.length);

    await this.printRaw(fullData);
  }
}

export const thermalPrinterService = new ThermalPrinterService();
