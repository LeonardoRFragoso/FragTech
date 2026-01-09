import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  components: ComponentHealth[];
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();
  private readonly version = process.env.APP_VERSION || '1.0.0';

  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthStatus> {
    const components = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDiskSpace(),
    ]);

    const overallStatus = this.calculateOverallStatus(components);

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
      components,
    };
  }

  async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        name: 'database',
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  checkMemory(): ComponentHealth {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const percentage = (heapUsedMB / heapTotalMB) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (percentage > 90) status = 'unhealthy';
    else if (percentage > 75) status = 'degraded';

    return {
      name: 'memory',
      status,
      message: `${heapUsedMB}MB / ${heapTotalMB}MB (${percentage.toFixed(1)}%)`,
    };
  }

  checkDiskSpace(): ComponentHealth {
    // Simplified check - in production use proper disk space library
    return {
      name: 'disk',
      status: 'healthy',
      message: 'Disk space check not implemented in sandbox',
    };
  }

  async getLiveness(): Promise<{ status: string }> {
    return { status: 'ok' };
  }

  async getReadiness(): Promise<{ status: string; checks: Record<string, boolean> }> {
    const dbHealthy = (await this.checkDatabase()).status === 'healthy';
    
    return {
      status: dbHealthy ? 'ok' : 'not_ready',
      checks: {
        database: dbHealthy,
      },
    };
  }

  private calculateOverallStatus(components: ComponentHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (components.some(c => c.status === 'unhealthy')) return 'unhealthy';
    if (components.some(c => c.status === 'degraded')) return 'degraded';
    return 'healthy';
  }
}
