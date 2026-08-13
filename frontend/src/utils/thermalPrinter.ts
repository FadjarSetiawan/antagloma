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

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'bluetooth' in navigator;
  }

  public getConnectedDeviceName(): string | null {
    return this.deviceConfig?.connected ? this.deviceConfig.name : null;
  }

  public async connect(): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth API tidak didukung oleh browser ini. Gunakan Chrome/Edge di Android/Windows.');
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        ],
      });

      return await this.setupDevice(device);
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error('Pencarian printer dibatalkan oleh pengguna.');
      }
      throw new Error(err.message || 'Gagal terhubung ke printer Bluetooth.');
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
    if (!this.deviceConfig || !this.deviceConfig.device) {
      await this.connect();
      return;
    }

    // Check if GATT server is still connected, if not, reconnect silently to known paired device
    if (!this.deviceConfig.device.gatt.connected) {
      await this.setupDevice(this.deviceConfig.device);
    }
  }

  public async printRaw(data: Uint8Array): Promise<void> {
    await this.ensureConnected();

    if (!this.deviceConfig || !this.deviceConfig.characteristic) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }

    const CHUNK_SIZE = 512;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (this.deviceConfig.characteristic.properties.writeWithoutResponse) {
        await this.deviceConfig.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.deviceConfig.characteristic.writeValue(chunk);
      }
      await new Promise((res) => setTimeout(res, 40));
    }
  }

  /**
   * Convert an HTML Element (Modal Nota/Label) into a 1-bit Monochrome Bitmap (576px wide for 80mm thermal printers)
   * and print directly via ESC/POS raster commands GS v 0.
   */
  public async printElementAsBitmap(element: HTMLElement, targetWidth = 576): Promise<void> {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    const aspect = canvas.height / canvas.width;
    const width = targetWidth; // 576 pixels for 80mm thermal printer head
    const height = Math.round(targetWidth * aspect);

    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    const ctx = resizedCanvas.getContext('2d');

    if (!ctx) throw new Error('Gagal memproses gambar cetak.');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(canvas, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    // Convert RGBA pixels into 1-bit monochrome raster data for ESC/POS GS v 0
    const bytesPerLine = width / 8;
    const imageBytes = new Uint8Array(bytesPerLine * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        // Luminance thresholding
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        const isBlack = brightness < 160;

        if (isBlack) {
          const byteIndex = y * bytesPerLine + Math.floor(x / 8);
          const bitIndex = 7 - (x % 8);
          imageBytes[byteIndex] |= 1 << bitIndex;
        }
      }
    }

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
