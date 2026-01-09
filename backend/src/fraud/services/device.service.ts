import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(
    userId: string,
    fingerprint: string,
    metadata: {
      deviceType: string;
      browser?: string;
      os?: string;
      ipAddress?: string;
      location?: any;
    },
  ) {
    const existing = await this.prisma.userDevice.findFirst({
      where: { userId, fingerprint },
    });

    if (existing) {
      return this.prisma.userDevice.update({
        where: { id: existing.id },
        data: {
          lastUsedAt: new Date(),
          ipAddress: metadata.ipAddress,
          location: metadata.location,
        },
      });
    }

    return this.prisma.userDevice.create({
      data: {
        userId,
        fingerprint,
        deviceType: metadata.deviceType,
        browser: metadata.browser,
        os: metadata.os,
        ipAddress: metadata.ipAddress,
        location: metadata.location,
        trustLevel: 'UNKNOWN',
        lastUsedAt: new Date(),
      },
    });
  }

  async getUserDevices(userId: string) {
    return this.prisma.userDevice.findMany({
      where: { userId, isActive: true },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async isKnownDevice(userId: string, fingerprint: string): Promise<boolean> {
    const device = await this.prisma.userDevice.findFirst({
      where: { userId, fingerprint, isActive: true },
    });
    return !!device;
  }

  async getTrustedDevices(userId: string) {
    return this.prisma.userDevice.findMany({
      where: {
        userId,
        isActive: true,
        trustLevel: { in: ['HIGH', 'TRUSTED'] },
      },
    });
  }

  async setDeviceTrust(deviceId: string, trustLevel: 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'TRUSTED') {
    return this.prisma.userDevice.update({
      where: { id: deviceId },
      data: { trustLevel },
    });
  }

  async deactivateDevice(deviceId: string, userId: string) {
    return this.prisma.userDevice.updateMany({
      where: { id: deviceId, userId },
      data: { isActive: false },
    });
  }

  async deactivateAllDevices(userId: string) {
    return this.prisma.userDevice.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  async getDeviceByFingerprint(userId: string, fingerprint: string) {
    return this.prisma.userDevice.findFirst({
      where: { userId, fingerprint },
    });
  }

  async incrementDeviceTrust(userId: string, fingerprint: string): Promise<void> {
    const device = await this.getDeviceByFingerprint(userId, fingerprint);
    
    if (!device) return;

    const trustProgression: Record<string, string> = {
      UNKNOWN: 'LOW',
      LOW: 'MEDIUM',
      MEDIUM: 'HIGH',
      HIGH: 'TRUSTED',
      TRUSTED: 'TRUSTED',
    };

    const newTrust = trustProgression[device.trustLevel] || 'LOW';

    await this.prisma.userDevice.update({
      where: { id: device.id },
      data: { trustLevel: newTrust as any },
    });

    this.logger.log(`Device trust upgraded for user ${userId}: ${device.trustLevel} -> ${newTrust}`);
  }
}
