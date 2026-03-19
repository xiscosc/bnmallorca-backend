import type { DeviceDto } from '../types/components.dto';
import { DeviceEntity } from './entities/device.entity';

export class DeviceRepository {
  public async getDevice(token: string): Promise<DeviceDto | undefined> {
    const result = await DeviceEntity.get({ token }).go({ ignoreOwnership: true });
    return (result.data as DeviceDto) ?? undefined;
  }

  public async putDevice(device: DeviceDto) {
    await DeviceEntity.put(device).go({ ignoreOwnership: true });
  }

  public async getDevicesByStatus(status: number, limit?: number): Promise<DeviceDto[]> {
    const result = await DeviceEntity.query
      .byStatusSubscribedAt({ status })
      .go({ order: 'asc', limit, ignoreOwnership: true });

    return result.data as DeviceDto[];
  }

  public async getNotRenewedDevices(status: number, ts: number): Promise<DeviceDto[]> {
    const result = await DeviceEntity.query
      .byStatusSubscribedAt({ status })
      .lte({ subscribedAt: ts })
      .go({ ignoreOwnership: true });

    return result.data as DeviceDto[];
  }

  public async deleteDevices(tokens: string[]) {
    await DeviceEntity.delete(tokens.map((token) => ({ token }))).go({ ignoreOwnership: true });
  }

  public async createDevices(devices: DeviceDto[]) {
    await DeviceEntity.put(devices).go({ ignoreOwnership: true });
  }
}
