// Bluetooth ESC/POS Thermal Printer Utility for Web Bluetooth API

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
      await new Promise((res) => setTimeout(res, 50));
    }
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
