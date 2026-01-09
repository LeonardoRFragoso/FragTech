import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { MfaService } from './services/mfa.service';
import { RateLimitService } from './services/rate-limit.service';
import { EncryptionService } from './services/encryption.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    MfaService,
    RateLimitService,
    EncryptionService,
  ],
  exports: [SecurityService, MfaService, RateLimitService, EncryptionService],
})
export class SecurityModule {}
